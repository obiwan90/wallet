// Gas Optimization Service for Smart Fee Management
import { walletService } from './web3';

export interface GasPrice {
  slow: string;
  standard: string;
  fast: string;
  instant: string;
  slowWait: number;    // Expected wait time in seconds
  standardWait: number;
  fastWait: number;
  instantWait: number;
}

export interface GasPrediction {
  currentPrice: GasPrice;
  prediction: {
    nextHour: 'increase' | 'decrease' | 'stable';
    confidence: number; // 0-100
    recommendedAction: 'wait' | 'send_now' | 'send_fast';
    bestTimeToSend: number; // Timestamp
  };
  historicalData: {
    timestamp: number;
    gasPrice: number;
  }[];
}

export interface EIP1559Fees {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  baseFee: string;
  estimatedWaitTime: number;
}

export interface GasOptimizationSuggestion {
  type: 'eip1559' | 'legacy';
  fees: EIP1559Fees | { gasPrice: string };
  estimatedCost: string;
  estimatedTime: number;
  savings: string;
  confidence: number;
}

// Gas price data sources
const GAS_API_ENDPOINTS = {
  ethereum: [
    'https://api.etherscan.io/api?module=gastracker&action=gasoracle',
    'https://gas-api.metaswap.codefi.network/networks/1/suggestedGasFees'
  ],
  polygon: [
    'https://gasstation.polygon.technology/v2'
  ],
  bsc: [
    'https://api.bscscan.com/api?module=gastracker&action=gasoracle'
  ]
};

class GasOptimizer {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 60000; // 1 minute
  private readonly HISTORY_SIZE = 100;
  
  private gasHistory: { timestamp: number; gasPrice: number }[] = [];

  // Get current gas prices for the network
  async getCurrentGasPrice(): Promise<GasPrice | null> {
    const currentChain = walletService.getCurrentChain();
    const cacheKey = `gas_price_${currentChain.id}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      let gasData: GasPrice | null = null;

      switch (currentChain.id) {
        case 1: // Ethereum
          gasData = await this.getEthereumGasPrice();
          break;
        case 137: // Polygon
          gasData = await this.getPolygonGasPrice();
          break;
        case 56: // BSC
          gasData = await this.getBSCGasPrice();
          break;
        default:
          gasData = await this.getGenericGasPrice();
      }

      if (gasData) {
        this.cache.set(cacheKey, { data: gasData, timestamp: Date.now() });
        this.addToHistory(parseFloat(gasData.standard));
      }

      return gasData;
    } catch (error) {
      console.error('Failed to get gas price:', error);
      return null;
    }
  }

  // Get Ethereum gas prices
  private async getEthereumGasPrice(): Promise<GasPrice | null> {
    try {
      // Try MetaMask Gas API first
      const response = await fetch('https://gas-api.metaswap.codefi.network/networks/1/suggestedGasFees');
      
      if (response.ok) {
        const data = await response.json();
        
        return {
          slow: data.low.suggestedMaxFeePerGas,
          standard: data.medium.suggestedMaxFeePerGas,
          fast: data.high.suggestedMaxFeePerGas,
          instant: (parseFloat(data.high.suggestedMaxFeePerGas) * 1.2).toString(),
          slowWait: 300,      // 5 minutes
          standardWait: 120,  // 2 minutes
          fastWait: 60,       // 1 minute
          instantWait: 30     // 30 seconds
        };
      }

      // Fallback to Etherscan
      const etherscanResponse = await fetch(
        'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken'
      );
      
      if (etherscanResponse.ok) {
        const data = await etherscanResponse.json();
        
        return {
          slow: data.result.SafeGasPrice,
          standard: data.result.StandardGasPrice,
          fast: data.result.FastGasPrice,
          instant: (parseFloat(data.result.FastGasPrice) * 1.5).toString(),
          slowWait: 600,
          standardWait: 180,
          fastWait: 60,
          instantWait: 30
        };
      }
    } catch (error) {
      console.warn('External gas API failed, using on-chain data:', error);
    }

    // Fallback to on-chain gas price
    return this.getGenericGasPrice();
  }

  // Get Polygon gas prices
  private async getPolygonGasPrice(): Promise<GasPrice | null> {
    try {
      const response = await fetch('https://gasstation.polygon.technology/v2');
      
      if (response.ok) {
        const data = await response.json();
        
        return {
          slow: Math.ceil(data.safeLow.maxFee).toString(),
          standard: Math.ceil(data.standard.maxFee).toString(),
          fast: Math.ceil(data.fast.maxFee).toString(),
          instant: Math.ceil(data.fast.maxFee * 1.3).toString(),
          slowWait: 600,
          standardWait: 120,
          fastWait: 60,
          instantWait: 30
        };
      }
    } catch (error) {
      console.warn('Polygon gas API failed:', error);
    }

    return this.getGenericGasPrice();
  }

  // Get BSC gas prices
  private async getBSCGasPrice(): Promise<GasPrice | null> {
    try {
      const response = await fetch(
        'https://api.bscscan.com/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken'
      );
      
      if (response.ok) {
        const data = await response.json();
        
        return {
          slow: data.result.SafeGasPrice,
          standard: data.result.StandardGasPrice,
          fast: data.result.FastGasPrice,
          instant: (parseFloat(data.result.FastGasPrice) * 1.2).toString(),
          slowWait: 180,
          standardWait: 60,
          fastWait: 30,
          instantWait: 15
        };
      }
    } catch (error) {
      console.warn('BSC gas API failed:', error);
    }

    return this.getGenericGasPrice();
  }

  // Generic on-chain gas price for unsupported networks
  private async getGenericGasPrice(): Promise<GasPrice | null> {
    try {
      const gasPriceHex = await walletService.makeRpcRequest('eth_gasPrice');
      const gasPrice = parseInt(gasPriceHex, 16);
      const gasPriceGwei = (gasPrice / 1e9).toString();
      
      return {
        slow: (gasPrice * 0.8 / 1e9).toString(),
        standard: gasPriceGwei,
        fast: (gasPrice * 1.2 / 1e9).toString(),
        instant: (gasPrice * 1.5 / 1e9).toString(),
        slowWait: 300,
        standardWait: 120,
        fastWait: 60,
        instantWait: 30
      };
    } catch (error) {
      console.error('Failed to get on-chain gas price:', error);
      return null;
    }
  }

  // Get EIP-1559 optimized fees
  async getEIP1559Fees(priority: 'slow' | 'standard' | 'fast' | 'instant' = 'standard'): Promise<EIP1559Fees | null> {
    const currentChain = walletService.getCurrentChain();
    
    // Only for EIP-1559 compatible chains
    if (![1, 137, 42161, 10, 8453].includes(currentChain.id)) {
      return null;
    }

    try {
      // Get base fee from latest block
      const latestBlock = await walletService.makeRpcRequest('eth_getBlockByNumber', ['latest', false]);
      const baseFee = parseInt(latestBlock.baseFeePerGas, 16) / 1e9; // Convert to Gwei

      const gasPrice = await this.getCurrentGasPrice();
      if (!gasPrice) return null;

      let maxPriorityFeePerGas: number;
      let maxFeePerGas: number;
      let estimatedWaitTime: number;

      switch (priority) {
        case 'slow':
          maxPriorityFeePerGas = 1; // 1 Gwei
          maxFeePerGas = baseFee + maxPriorityFeePerGas;
          estimatedWaitTime = gasPrice.slowWait;
          break;
        case 'standard':
          maxPriorityFeePerGas = 1.5; // 1.5 Gwei
          maxFeePerGas = baseFee + maxPriorityFeePerGas;
          estimatedWaitTime = gasPrice.standardWait;
          break;
        case 'fast':
          maxPriorityFeePerGas = 2; // 2 Gwei
          maxFeePerGas = baseFee + maxPriorityFeePerGas;
          estimatedWaitTime = gasPrice.fastWait;
          break;
        case 'instant':
          maxPriorityFeePerGas = 3; // 3 Gwei
          maxFeePerGas = baseFee + maxPriorityFeePerGas;
          estimatedWaitTime = gasPrice.instantWait;
          break;
      }

      return {
        maxFeePerGas: maxFeePerGas.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
        baseFee: baseFee.toString(),
        estimatedWaitTime
      };
    } catch (error) {
      console.error('Failed to get EIP-1559 fees:', error);
      return null;
    }
  }

  // Get gas optimization suggestions
  async getOptimizationSuggestions(gasLimit: number = 21000): Promise<GasOptimizationSuggestion[]> {
    const suggestions: GasOptimizationSuggestion[] = [];
    const currentChain = walletService.getCurrentChain();
    
    try {
      const gasPrice = await this.getCurrentGasPrice();
      if (!gasPrice) return suggestions;

      // EIP-1559 suggestions for supported chains
      if ([1, 137, 42161, 10, 8453].includes(currentChain.id)) {
        const eip1559Fees = await this.getEIP1559Fees('standard');
        if (eip1559Fees) {
          const estimatedCost = (parseFloat(eip1559Fees.maxFeePerGas) * gasLimit / 1e9).toString();
          
          suggestions.push({
            type: 'eip1559',
            fees: eip1559Fees,
            estimatedCost,
            estimatedTime: eip1559Fees.estimatedWaitTime,
            savings: '0', // Calculate based on comparison
            confidence: 85
          });
        }
      }

      // Legacy transaction suggestions
      const legacyEstimatedCost = (parseFloat(gasPrice.standard) * gasLimit / 1e9).toString();
      
      suggestions.push({
        type: 'legacy',
        fees: { gasPrice: gasPrice.standard },
        estimatedCost: legacyEstimatedCost,
        estimatedTime: gasPrice.standardWait,
        savings: '0',
        confidence: 75
      });

      // Calculate savings between suggestions
      if (suggestions.length > 1) {
        const cheapest = suggestions.reduce((min, current) => 
          parseFloat(current.estimatedCost) < parseFloat(min.estimatedCost) ? current : min
        );
        
        suggestions.forEach(suggestion => {
          if (suggestion !== cheapest) {
            const savings = parseFloat(suggestion.estimatedCost) - parseFloat(cheapest.estimatedCost);
            suggestion.savings = savings.toString();
          }
        });
      }

      return suggestions.sort((a, b) => parseFloat(a.estimatedCost) - parseFloat(b.estimatedCost));
    } catch (error) {
      console.error('Failed to get optimization suggestions:', error);
      return suggestions;
    }
  }

  // Get gas price predictions
  async getGasPrediction(): Promise<GasPrediction | null> {
    try {
      const currentPrice = await this.getCurrentGasPrice();
      if (!currentPrice) return null;

      // Analyze historical data for trends
      const trend = this.analyzeGasTrend();
      const confidence = Math.min(this.gasHistory.length * 10, 100); // More data = higher confidence

      let recommendedAction: 'wait' | 'send_now' | 'send_fast';
      let nextHour: 'increase' | 'decrease' | 'stable';

      if (trend > 0.1) {
        nextHour = 'increase';
        recommendedAction = 'send_now';
      } else if (trend < -0.1) {
        nextHour = 'decrease';
        recommendedAction = 'wait';
      } else {
        nextHour = 'stable';
        recommendedAction = 'send_now';
      }

      // Calculate best time to send (simplified)
      const bestTimeToSend = nextHour === 'decrease' 
        ? Date.now() + 3600000 // 1 hour from now
        : Date.now();

      return {
        currentPrice,
        prediction: {
          nextHour,
          confidence,
          recommendedAction,
          bestTimeToSend
        },
        historicalData: this.gasHistory.slice(-24) // Last 24 data points
      };
    } catch (error) {
      console.error('Failed to get gas prediction:', error);
      return null;
    }
  }

  // Analyze gas price trends
  private analyzeGasTrend(): number {
    if (this.gasHistory.length < 3) return 0;

    const recent = this.gasHistory.slice(-5);
    const older = this.gasHistory.slice(-10, -5);

    if (older.length === 0) return 0;

    const recentAvg = recent.reduce((sum, item) => sum + item.gasPrice, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.gasPrice, 0) / older.length;

    return (recentAvg - olderAvg) / olderAvg; // Return percentage change
  }

  // Add gas price to history
  private addToHistory(gasPrice: number): void {
    this.gasHistory.push({
      timestamp: Date.now(),
      gasPrice
    });

    // Keep only recent history
    if (this.gasHistory.length > this.HISTORY_SIZE) {
      this.gasHistory = this.gasHistory.slice(-this.HISTORY_SIZE);
    }
  }

  // Calculate optimal gas price for urgency level
  getOptimalGasPrice(urgency: 'low' | 'medium' | 'high' | 'urgent', gasPrice: GasPrice): string {
    switch (urgency) {
      case 'low':
        return gasPrice.slow;
      case 'medium':
        return gasPrice.standard;
      case 'high':
        return gasPrice.fast;
      case 'urgent':
        return gasPrice.instant;
      default:
        return gasPrice.standard;
    }
  }

  // Get gas cost in USD (requires price service)
  async getGasCostInUSD(gasLimit: number, gasPriceGwei: string): Promise<string> {
    try {
      const currentChain = walletService.getCurrentChain();
      let nativeTokenPrice = 2500; // Default ETH price
      
      // Get native token price based on chain
      // This would need integration with your price service
      
      const gasCostETH = (parseFloat(gasPriceGwei) * gasLimit) / 1e9;
      const gasCostUSD = gasCostETH * nativeTokenPrice;
      
      return gasCostUSD.toFixed(4);
    } catch (error) {
      console.error('Failed to calculate gas cost in USD:', error);
      return '0';
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get network-specific gas tips
  getNetworkGasTips(): string[] {
    const currentChain = walletService.getCurrentChain();
    
    switch (currentChain.id) {
      case 1: // Ethereum
        return [
          '在工作日早上 UTC 时间 gas 费通常较低',
          '周末的 gas 费一般比工作日便宜',
          '使用 EIP-1559 可以更精确地控制费用',
          'DeFi 活动高峰期避免交易可节省费用'
        ];
      case 137: // Polygon
        return [
          'Polygon 的 gas 费用相对较低且稳定',
          '使用 MATIC 代币支付 gas 费',
          '交易确认时间通常在 2-5 秒',
          '建议使用标准 gas 价格即可快速确认'
        ];
      case 56: // BSC
        return [
          'BSC 的 gas 费用通常很低',
          '使用 BNB 代币支付 gas 费',
          '交易确认时间约 3 秒',
          '即使使用较低的 gas 价格也能快速确认'
        ];
      default:
        return [
          '监控网络拥堵情况来选择合适的 gas 价格',
          '非紧急交易可以等待网络不繁忙时进行',
          '使用较低的 gas 价格可以节省费用但需要更长等待时间'
        ];
    }
  }
}

export const gasOptimizer = new GasOptimizer();