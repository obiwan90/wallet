// DEX Integration Service for Token Swapping
import { Address, parseUnits, formatUnits, encodeFunctionData } from 'viem';
import { walletService } from './web3';
import { priceService } from './price-service';

export interface SwapQuote {
  fromToken: Address;
  toToken: Address;
  fromAmount: string;
  toAmount: string;
  toAmountMin: string; // Minimum amount considering slippage
  priceImpact: number;
  fee: string;
  gas: string;
  route: SwapRoute[];
  provider: string;
  validFor: number; // Seconds
}

export interface SwapRoute {
  protocol: string;
  poolAddress: Address;
  fee: number;
  percentage: number;
}

export interface SwapParams {
  fromToken: Address;
  toToken: Address;
  amount: string;
  slippage: number; // Percentage (e.g., 0.5 for 0.5%)
  recipient?: Address;
  deadline?: number;
}

export interface SwapResult {
  success: boolean;
  hash?: string;
  error?: string;
  amountOut?: string;
}

// Uniswap V2 Router ABI (simplified)
const UNISWAP_V2_ROUTER_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' }
    ],
    name: 'swapExactTokensForTokens',
    outputs: [
      { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' }
    ],
    name: 'getAmountsOut',
    outputs: [
      { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// DEX Router addresses for different networks
const DEX_ROUTERS: Record<number, { uniswapV2: Address; sushiswap?: Address; uniswapV3?: Address }> = {
  1: { // Ethereum
    uniswapV2: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    uniswapV3: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    sushiswap: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'
  },
  137: { // Polygon
    uniswapV2: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // QuickSwap
    uniswapV3: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    sushiswap: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
  },
  56: { // BSC
    uniswapV2: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // PancakeSwap V2
    sushiswap: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
  },
  43114: { // Avalanche
    uniswapV2: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4', // Trader Joe
    sushiswap: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
  },
  42161: { // Arbitrum
    uniswapV2: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    uniswapV3: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    sushiswap: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
  },
  10: { // Optimism
    uniswapV2: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    uniswapV3: '0xE592427A0AEce92De3Edee1F18E0157C05861564'
  },
  8453: { // Base
    uniswapV2: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    uniswapV3: '0x2626664c2603336E57B271c5C0b26F421741e481'
  }
};

// Common base tokens for routing
const BASE_TOKENS: Record<number, Address[]> = {
  1: [
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    '0xA0b86a33E6441cc2bbC9dd1c6A8beD47aA00E5e4', // USDC
    '0xdAC17F958D2ee523a2206206994597C13D831ec7'  // USDT
  ],
  137: [
    '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
    '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'  // USDT
  ],
  56: [
    '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
    '0x55d398326f99059fF775485246999027B3197955'  // USDT
  ],
  43114: [
    '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', // WAVAX
    '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC
    '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7'  // USDT
  ],
  42161: [
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
    '0xA0b86a33E6441cc2bbC9dd1c6A8beD47aA00E5e4', // USDC
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'  // USDT
  ],
  10: [
    '0x4200000000000000000000000000000000000006', // WETH
    '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // USDC
    '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'  // USDT
  ],
  8453: [
    '0x4200000000000000000000000000000000000006', // WETH
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb'  // DAI
  ]
};

class SwapService {
  private cache = new Map<string, { quote: SwapQuote; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  // Get swap quote from multiple DEX protocols
  async getSwapQuote(params: SwapParams): Promise<SwapQuote | null> {
    const cacheKey = `${params.fromToken}-${params.toToken}-${params.amount}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.quote;
    }

    try {
      const currentChain = walletService.getCurrentChain();
      const routers = DEX_ROUTERS[currentChain.id];
      
      if (!routers) {
        throw new Error(`DEX not supported on chain ${currentChain.id}`);
      }

      // Try to get quotes from available DEX protocols
      const quotes = await Promise.allSettled([
        this.getUniswapQuote(params, routers.uniswapV2),
        ...(routers.sushiswap ? [this.getSushiswapQuote(params, routers.sushiswap)] : [])
      ]);

      const successfulQuotes = quotes
        .filter((result): result is PromiseFulfilledResult<SwapQuote> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      if (successfulQuotes.length === 0) {
        return null;
      }

      // Return the best quote (highest output amount)
      const bestQuote = successfulQuotes.reduce((best, current) => 
        parseFloat(current.toAmount) > parseFloat(best.toAmount) ? current : best
      );

      // Cache the result
      this.cache.set(cacheKey, { quote: bestQuote, timestamp: Date.now() });
      
      return bestQuote;
    } catch (error) {
      console.error('Failed to get swap quote:', error);
      return null;
    }
  }

  // Get quote from Uniswap V2 compatible DEX
  private async getUniswapQuote(params: SwapParams, routerAddress: Address): Promise<SwapQuote> {
    const path = await this.findBestPath(params.fromToken, params.toToken);
    const amountIn = parseUnits(params.amount, 18); // Assume 18 decimals for now

    try {
      // Get amounts out from the router using a simplified approach
      // Note: This is a simplified implementation
      // In production, you would use a proper DEX SDK or aggregator API
      
      // For now, simulate a 1:1 exchange rate with small slippage
      const outputAmount = BigInt(Math.floor(Number(amountIn) * 0.98)); // 2% slippage simulation
      const toAmount = formatUnits(outputAmount, 18);

      if (Number(toAmount) <= 0) {
        throw new Error('No liquidity available');
      }
      
      // Calculate minimum amount with slippage
      const slippageFactor = (100 - params.slippage) / 100;
      const toAmountMin = (parseFloat(toAmount) * slippageFactor).toString();

      // Estimate gas cost (simplified)
      const gasEstimate = '150000'; // Default gas estimate for swaps

      // Calculate price impact (simplified)
      const priceImpact = await this.calculatePriceImpact(params.fromToken, params.toToken, params.amount, toAmount);

      return {
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.amount,
        toAmount,
        toAmountMin,
        priceImpact,
        fee: '0.3', // 0.3% typical Uniswap fee
        gas: gasEstimate,
        route: [{
          protocol: 'Uniswap V2',
          poolAddress: routerAddress,
          fee: 0.3,
          percentage: 100
        }],
        provider: 'Uniswap V2',
        validFor: 30
      };
    } catch (error) {
      console.error('Uniswap quote failed:', error);
      throw error;
    }
  }

  // Get quote from SushiSwap
  private async getSushiswapQuote(params: SwapParams, routerAddress: Address): Promise<SwapQuote> {
    // Similar to Uniswap but with SushiSwap branding
    const quote = await this.getUniswapQuote(params, routerAddress);
    return {
      ...quote,
      provider: 'SushiSwap',
      route: [{
        protocol: 'SushiSwap',
        poolAddress: routerAddress,
        fee: 0.3,
        percentage: 100
      }]
    };
  }

  // Execute the swap transaction
  async executeSwap(quote: SwapQuote, recipient: Address, deadline?: number): Promise<SwapResult> {
    try {
      const currentChain = walletService.getCurrentChain();
      const routers = DEX_ROUTERS[currentChain.id];
      
      if (!routers) {
        throw new Error(`DEX not supported on chain ${currentChain.id}`);
      }

      const routerAddress = routers.uniswapV2; // Use Uniswap V2 for now
      const path = await this.findBestPath(quote.fromToken, quote.toToken);
      const swapDeadline = deadline || Math.floor(Date.now() / 1000) + 1200; // 20 minutes

      const amountIn = parseUnits(quote.fromAmount, 18);
      const amountOutMin = parseUnits(quote.toAmountMin, 18);

      // Encode the swap function call
      const data = encodeFunctionData({
        abi: UNISWAP_V2_ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [amountIn, amountOutMin, path, recipient, BigInt(swapDeadline)]
      });

      // Estimate gas
      const gasLimit = await walletService.makeRpcRequest('eth_estimateGas', [{
        to: routerAddress,
        data,
        from: recipient
      }]);

      // Execute the transaction
      const result = await walletService.sendTransaction({
        to: routerAddress,
        data,
        gasLimit: BigInt(gasLimit)
      });

      return {
        success: result.success,
        hash: result.hash,
        error: result.error
      };
    } catch (error) {
      console.error('Swap execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Find the best trading path between two tokens
  private async findBestPath(fromToken: Address, toToken: Address): Promise<Address[]> {
    const currentChain = walletService.getCurrentChain();
    const baseTokens = BASE_TOKENS[currentChain.id] || [];
    
    // Direct path
    if (fromToken !== toToken) {
      // Check if we need an intermediate token
      const isFromBaseToken = baseTokens.includes(fromToken);
      const isToBaseToken = baseTokens.includes(toToken);
      
      if (isFromBaseToken || isToBaseToken) {
        return [fromToken, toToken];
      }
      
      // Use WETH/WMATIC/WBNB as intermediate
      const wethAddress = baseTokens[0];
      if (wethAddress) {
        return [fromToken, wethAddress, toToken];
      }
    }
    
    return [fromToken, toToken];
  }

  // Estimate gas cost for swap
  private async estimateSwapGas(params: SwapParams, routerAddress: Address, path: Address[]): Promise<string> {
    try {
      const amountIn = parseUnits(params.amount, 18);
      const amountOutMin = parseUnits('0', 18); // Use 0 for estimation
      const deadline = Math.floor(Date.now() / 1000) + 1200;
      
      const data = encodeFunctionData({
        abi: UNISWAP_V2_ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [amountIn, amountOutMin, path, '0x0000000000000000000000000000000000000000' as Address, BigInt(deadline)]
      });

      const gasEstimate = await walletService.makeRpcRequest('eth_estimateGas', [{
        to: routerAddress,
        data
      }]);

      return parseInt(gasEstimate, 16).toString();
    } catch (error) {
      console.warn('Gas estimation failed, using default:', error);
      return '200000'; // Default gas limit
    }
  }

  // Calculate price impact
  private async calculatePriceImpact(fromToken: Address, toToken: Address, fromAmount: string, toAmount: string): Promise<number> {
    try {
      // Get current market prices
      const fromPrice = await priceService.getTokenPrice('ETH', 1); // Simplified
      const toPrice = await priceService.getTokenPrice('USDC', 1);   // Simplified
      
      if (!fromPrice || !toPrice) {
        return 0;
      }

      const expectedToAmount = parseFloat(fromAmount) * (fromPrice.priceUsd / toPrice.priceUsd);
      const actualToAmount = parseFloat(toAmount);
      
      const priceImpact = ((expectedToAmount - actualToAmount) / expectedToAmount) * 100;
      return Math.max(0, priceImpact);
    } catch (error) {
      console.warn('Price impact calculation failed:', error);
      return 0;
    }
  }

  // Get supported tokens for current network
  getSupportedTokens(): Address[] {
    const currentChain = walletService.getCurrentChain();
    return BASE_TOKENS[currentChain.id] || [];
  }

  // Check if swap is supported on current network
  isSwapSupported(): boolean {
    const currentChain = walletService.getCurrentChain();
    return !!DEX_ROUTERS[currentChain.id];
  }

  // Clear quote cache
  clearCache(): void {
    this.cache.clear();
  }
}

export const swapService = new SwapService();