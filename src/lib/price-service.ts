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
  private readonly CACHE_DURATION = 300 * 1000; // 5 minute cache (increased to reduce API calls)
  private lastRequestTime: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 6000; // 6 seconds between requests
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue: boolean = false;
  
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
      'WETH': 'weth',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'UNI': 'uniswap',
      'LINK': 'chainlink',
      'MATIC': 'matic-network',
      'DAI': 'dai',
      'SHIB': 'shiba-inu'
    },
    137: { // Polygon
      'MATIC': 'matic-network',
      'WMATIC': 'matic-network',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'WETH': 'weth',
      'UNI': 'uniswap',
      'LINK': 'chainlink',
      'DAI': 'dai',
      'WBTC': 'wrapped-bitcoin'
    },
    56: { // BSC
      'BNB': 'binancecoin',
      'WBNB': 'wbnb',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'ETH': 'ethereum',
      'DOT': 'polkadot',
      'LINK': 'chainlink',
      'XRP': 'ripple',
      'AVAX': 'avalanche-2'
    },
    43114: { // Avalanche
      'AVAX': 'avalanche-2',
      'WAVAX': 'avalanche-2',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'WETH': 'weth',
      'LINK': 'chainlink',
      'DAI': 'dai'
    },
    42161: { // Arbitrum
      'ETH': 'ethereum',
      'WETH': 'weth',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'UNI': 'uniswap',
      'LINK': 'chainlink',
      'DAI': 'dai'
    },
    10: { // Optimism
      'ETH': 'ethereum',
      'WETH': 'weth',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'UNI': 'uniswap',
      'LINK': 'chainlink',
      'DAI': 'dai'
    },
    8453: { // Base
      'ETH': 'ethereum',
      'WETH': 'weth',
      'USDC': 'usd-coin',
      'DAI': 'dai',
      'AERO': 'aerodrome-finance'
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

  // Get prices for multiple tokens using batch requests
  async getTokenPrices(symbols: string[], chainId: number = 1): Promise<PriceData> {
    const results: PriceData = {};
    const uncachedSymbols: string[] = [];
    
    // First, check cache for all symbols
    for (const symbol of symbols) {
      const cacheKey = `${symbol}-${chainId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        results[symbol.toUpperCase()] = cached.data;
      } else {
        uncachedSymbols.push(symbol);
      }
    }
    
    // If we have cached data for all symbols, return immediately
    if (uncachedSymbols.length === 0) {
      return results;
    }
    
    // Fetch uncached symbols in batch
    try {
      const batchResults = await this.fetchBatchPrices(uncachedSymbols, chainId);
      
      // Merge batch results with cached results
      for (const [symbol, price] of Object.entries(batchResults)) {
        results[symbol] = price;
        
        // Cache the new data
        const cacheKey = `${symbol.toLowerCase()}-${chainId}`;
        this.cache.set(cacheKey, { data: price, timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Batch price fetch failed:', error);
      
      // Fallback to individual requests with rate limiting
      await this.fetchIndividualPricesWithRateLimit(uncachedSymbols, chainId, results);
    }
    
    return results;
  }

  // Rate-limited queue processing
  private async processRequestQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        // Ensure minimum interval between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
          await this.delay(this.MIN_REQUEST_INTERVAL - timeSinceLastRequest);
        }
        
        try {
          await request();
        } catch (error) {
          console.error('Queued request failed:', error);
        }
        
        this.lastRequestTime = Date.now();
      }
    }
    
    this.isProcessingQueue = false;
  }

  // Fetch individual prices with rate limiting
  private async fetchIndividualPricesWithRateLimit(
    symbols: string[], 
    chainId: number, 
    results: PriceData
  ): Promise<void> {
    const promises = symbols.map(symbol => {
      return new Promise<void>((resolve) => {
        const request = async () => {
          try {
            const price = await this.getTokenPrice(symbol, chainId);
            if (price) {
              results[symbol.toUpperCase()] = price;
            }
          } catch (error) {
            console.error(`Failed to fetch price for ${symbol}:`, error);
          }
          resolve();
        };
        
        this.requestQueue.push(request);
      });
    });

    // Start processing queue
    this.processRequestQueue();
    
    // Wait for all requests to complete
    await Promise.all(promises);
  }

  // Batch fetch prices from CoinGecko
  private async fetchBatchPrices(symbols: string[], chainId: number): Promise<PriceData> {
    // Map symbols to CoinGecko IDs
    const coinIds = symbols
      .map(symbol => this.SYMBOL_MAP[chainId]?.[symbol.toUpperCase()] || symbol.toLowerCase())
      .filter(Boolean);
    
    if (coinIds.length === 0) {
      return {};
    }
    
    // Batch request to CoinGecko
    const idsParam = coinIds.join(',');
    const response = await this.makeRateLimitedRequest(
      `${this.API_ENDPOINTS.coingecko}/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
    );
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded - will retry with fallback');
      }
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    const results: PriceData = {};
    
    // Process results and map back to original symbols
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const coinId = coinIds[i];
      const coinData = data[coinId];
      
      if (coinData) {
        results[symbol.toUpperCase()] = {
          symbol: symbol.toUpperCase(),
          priceUsd: coinData.usd || 0,
          change24h: coinData.usd_24h_change || 0,
          marketCap: coinData.usd_market_cap,
          volume24h: coinData.usd_24h_vol,
          lastUpdated: Date.now()
        };
      }
    }
    
    return results;
  }

  // Rate-limited request wrapper
  private async makeRateLimitedRequest(url: string): Promise<Response> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await this.delay(this.MIN_REQUEST_INTERVAL - timeSinceLastRequest);
    }
    
    this.lastRequestTime = Date.now();
    return fetch(url);
  }

  // Delay utility
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Fetch from CoinGecko API
  private async fetchFromCoinGecko(coinId: string): Promise<TokenPrice | null> {
    try {
      const response = await this.makeRateLimitedRequest(
        `${this.API_ENDPOINTS.coingecko}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
      );

      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`Rate limit hit for ${coinId}, waiting before retry...`);
          await this.delay(10000); // Wait 10 seconds before throwing
          throw new Error('Rate limit exceeded');
        }
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

  // Get mock price data for development/demo purposes
  getMockPriceData(symbols: string[]): PriceData {
    const mockPrices: Record<string, number> = {
      'ETH': 2234.56,
      'BTC': 43567.89,
      'USDC': 1.0,
      'USDT': 1.0,
      'BNB': 312.45,
      'MATIC': 0.89,
      'AVAX': 36.78,
      'UNI': 8.34,
      'LINK': 14.67,
      'DAI': 1.0,
      'WETH': 2234.56,
      'WBTC': 43567.89,
      'SHIB': 0.000024,
      'DOT': 7.89,
      'XRP': 0.52,
      'AERO': 1.23
    };

    const results: PriceData = {};
    
    symbols.forEach(symbol => {
      const price = mockPrices[symbol.toUpperCase()];
      if (price) {
        results[symbol.toUpperCase()] = {
          symbol: symbol.toUpperCase(),
          priceUsd: price,
          change24h: (Math.random() - 0.5) * 10, // Random change between -5% and +5%
          marketCap: price * 1000000000, // Mock market cap
          volume24h: price * 100000000, // Mock volume
          lastUpdated: Date.now()
        };
      }
    });

    return results;
  }

  // Enhanced method that falls back to mock data when APIs fail
  async getTokenPricesWithFallback(symbols: string[], chainId: number = 1): Promise<PriceData> {
    try {
      const results = await this.getTokenPrices(symbols, chainId);
      
      // If we got some results, return them
      if (Object.keys(results).length > 0) {
        return results;
      }
      
      // If no results, fall back to mock data
      console.warn('No API data available, using mock prices');
      return this.getMockPriceData(symbols);
    } catch (error) {
      console.error('All price APIs failed, using mock data:', error);
      return this.getMockPriceData(symbols);
    }
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