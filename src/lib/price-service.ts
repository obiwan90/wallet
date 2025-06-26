// Price service for fetching real-time cryptocurrency prices
export interface TokenPrice {
  symbol: string;
  priceUsd: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  lastUpdated: number;
}

export interface PriceData {
  [symbol: string]: TokenPrice;
}

class PriceService {
  private cache: Map<string, { data: TokenPrice; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 60 * 1000; // 1 minute cache
  private readonly API_ENDPOINTS = {
    // Using CoinGecko API (free tier)
    coingecko: 'https://api.coingecko.com/api/v3',
    // Backup: CryptoCompare API  
    cryptocompare: 'https://min-api.cryptocompare.com/data',
  };

  // Symbol mapping for different networks
  private readonly SYMBOL_MAP: Record<number, Record<string, string>> = {
    1: { // Ethereum
      'ETH': 'ethereum',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'UNI': 'uniswap',
      'WETH': 'weth',
    },
    137: { // Polygon
      'MATIC': 'matic-network',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'WETH': 'weth',
    },
    56: { // BSC
      'BNB': 'binancecoin',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'BUSD': 'binance-usd',
    },
    43114: { // Avalanche
      'AVAX': 'avalanche-2',
      'USDC': 'usd-coin',
      'USDT': 'tether',
    },
    42161: { // Arbitrum
      'ETH': 'ethereum',
      'USDC': 'usd-coin',
      'USDT': 'tether',
    },
    10: { // Optimism
      'ETH': 'ethereum',
      'USDC': 'usd-coin',
      'USDT': 'tether',
    },
    8453: { // Base
      'ETH': 'ethereum',
      'USDC': 'usd-coin',
    }
  };

  // Get price for a single token
  async getTokenPrice(symbol: string, chainId: number = 1): Promise<TokenPrice | null> {
    const cacheKey = `${symbol}-${chainId}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const coinId = this.SYMBOL_MAP[chainId]?.[symbol.toUpperCase()] || symbol.toLowerCase();
      const price = await this.fetchFromCoinGecko(coinId);
      
      if (price) {
        this.cache.set(cacheKey, { data: price, timestamp: Date.now() });
        return price;
      }

      // Fallback to CryptoCompare
      const fallbackPrice = await this.fetchFromCryptoCompare(symbol);
      if (fallbackPrice) {
        this.cache.set(cacheKey, { data: fallbackPrice, timestamp: Date.now() });
        return fallbackPrice;
      }

      return null;
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error);
      return null;
    }
  }

  // Get prices for multiple tokens
  async getTokenPrices(symbols: string[], chainId: number = 1): Promise<PriceData> {
    const results: PriceData = {};
    
    // Process in parallel for better performance
    const promises = symbols.map(async (symbol) => {
      const price = await this.getTokenPrice(symbol, chainId);
      if (price) {
        results[symbol.toUpperCase()] = price;
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  // Fetch from CoinGecko API
  private async fetchFromCoinGecko(coinId: string): Promise<TokenPrice | null> {
    try {
      const response = await fetch(
        `${this.API_ENDPOINTS.coingecko}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const coinData = data[coinId];

      if (!coinData) {
        return null;
      }

      return {
        symbol: coinId.toUpperCase(),
        priceUsd: coinData.usd || 0,
        change24h: coinData.usd_24h_change || 0,
        marketCap: coinData.usd_market_cap,
        volume24h: coinData.usd_24h_vol,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('CoinGecko API error:', error);
      return null;
    }
  }

  // Fallback to CryptoCompare API
  private async fetchFromCryptoCompare(symbol: string): Promise<TokenPrice | null> {
    try {
      const response = await fetch(
        `${this.API_ENDPOINTS.cryptocompare}/pricemultifull?fsyms=${symbol.toUpperCase()}&tsyms=USD`
      );

      if (!response.ok) {
        throw new Error(`CryptoCompare API error: ${response.status}`);
      }

      const data = await response.json();
      const coinData = data.RAW?.[symbol.toUpperCase()]?.USD;

      if (!coinData) {
        return null;
      }

      return {
        symbol: symbol.toUpperCase(),
        priceUsd: coinData.PRICE || 0,
        change24h: coinData.CHANGEPCT24HOUR || 0,
        marketCap: coinData.MKTCAP,
        volume24h: coinData.VOLUME24HOUR,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('CryptoCompare API error:', error);
      return null;
    }
  }

  // Get historical prices (for charts)
  async getHistoricalPrices(symbol: string, days: number = 7, chainId: number = 1): Promise<Array<{timestamp: number, price: number}> | null> {
    try {
      const coinId = this.SYMBOL_MAP[chainId]?.[symbol.toUpperCase()] || symbol.toLowerCase();
      const response = await fetch(
        `${this.API_ENDPOINTS.coingecko}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
      );

      if (!response.ok) {
        throw new Error(`CoinGecko historical data error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.prices?.map(([timestamp, price]: [number, number]) => ({
        timestamp,
        price
      })) || null;
    } catch (error) {
      console.error('Failed to fetch historical prices:', error);
      return null;
    }
  }

  // Calculate portfolio value
  async calculatePortfolioValue(holdings: Array<{symbol: string, amount: number, chainId?: number}>): Promise<number> {
    let totalValue = 0;

    for (const holding of holdings) {
      const price = await this.getTokenPrice(holding.symbol, holding.chainId || 1);
      if (price) {
        totalValue += holding.amount * price.priceUsd;
      }
    }

    return totalValue;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const priceService = new PriceService();

// Utility functions
export function formatPrice(price: number): string {
  if (price >= 1) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 6,
      maximumFractionDigits: 10
    }).format(price);
  }
}

export function formatChange(change: number): string {
  const formatted = Math.abs(change).toFixed(2);
  return `${change >= 0 ? '+' : '-'}${formatted}%`;
}

export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`;
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`;
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`;
  } else {
    return `$${marketCap.toFixed(0)}`;
  }
}