'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletInfo, walletService, TokenBalance, getCommonTokensForNetwork } from '@/lib/web3';
import { priceService, TokenPrice, PriceData } from '@/lib/price-service';

interface Web3ContextType {
  wallet: WalletInfo | null;
  isConnecting: boolean;
  isConnected: boolean;
  tokenBalances: TokenBalance[];
  isLoadingTokens: boolean;
  currentUserSession: { accountId: string; password: string } | null;
  priceData: PriceData;
  isLoadingPrices: boolean;
  portfolioValue: number;
  setWallet: (wallet: WalletInfo | null) => void;
  setCurrentUserSession: (session: { accountId: string; password: string } | null) => void;
  refreshBalance: () => Promise<void>;
  refreshTokenBalances: () => Promise<void>;
  refreshPrices: () => Promise<void>;
  networkHealth: { chainId: number; blockNumber: bigint; healthy: boolean } | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [networkHealth, setNetworkHealth] = useState<{ chainId: number; blockNumber: bigint; healthy: boolean } | null>(null);
  const [currentUserSession, setCurrentUserSession] = useState<{ accountId: string; password: string } | null>(null);
  const [priceData, setPriceData] = useState<PriceData>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [portfolioValue, setPortfolioValue] = useState(0);

  const refreshBalance = async () => {
    if (!wallet) return;
    try {
      setIsConnecting(true);
      const balanceResult = await walletService.getBalanceWithRetry(wallet.address);
      if (balanceResult.success) {
        setWallet(prev => prev ? { ...prev, balance: balanceResult.balance } : null);
      } else {
        console.warn('Balance refresh failed:', balanceResult.error);
      }
    } catch (error) {
      console.error('Balance refresh error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const refreshTokenBalances = async () => {
    if (!wallet) return;
    try {
      setIsLoadingTokens(true);
      const commonTokens = getCommonTokensForNetwork(wallet.chainId);
      const tokenAddresses = commonTokens.map(token => token.address);

      if (tokenAddresses.length > 0) {
        try {
          const balances = await walletService.getMultipleTokenBalances(tokenAddresses, wallet.address);
          setTokenBalances(balances);
        } catch (tokenError) {
          console.error('Failed to load token balances:', tokenError);
          // Set empty array on error to prevent UI issues
          setTokenBalances([]);
        }
      }
    } catch (error) {
      console.error('Token balance refresh failed:', error);
      setTokenBalances([]);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  const refreshPrices = async () => {
    if (!wallet) return;
    try {
      setIsLoadingPrices(true);
      
      // Get native token symbol based on chain
      const chainSymbols: Record<number, string> = {
        1: 'ETH',
        137: 'MATIC',
        56: 'BNB',
        43114: 'AVAX',
        42161: 'ETH',
        10: 'ETH',
        8453: 'ETH'
      };
      
      const nativeSymbol = chainSymbols[wallet.chainId] || 'ETH';
      
      // Get all token symbols for current network
      const commonTokens = getCommonTokensForNetwork(wallet.chainId);
      const tokenSymbols = [nativeSymbol, ...commonTokens.map(token => token.symbol)];
      
      // Remove duplicates
      const uniqueSymbols = [...new Set(tokenSymbols)];
      
      // Fetch prices with fallback to mock data
      const prices = await priceService.getTokenPricesWithFallback(uniqueSymbols, wallet.chainId);
      setPriceData(prices);
      
    } catch (error) {
      console.error('Price refresh failed:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  };

  // Calculate portfolio value
  const calculatePortfolioValue = async () => {
    if (!wallet || Object.keys(priceData).length === 0) return;
    
    try {
      let totalValue = 0;
      
      // Add native token value
      const chainSymbols: Record<number, string> = {
        1: 'ETH',
        137: 'MATIC', 
        56: 'BNB',
        43114: 'AVAX',
        42161: 'ETH',
        10: 'ETH',
        8453: 'ETH'
      };
      
      const nativeSymbol = chainSymbols[wallet.chainId] || 'ETH';
      const nativePrice = priceData[nativeSymbol];
      
      if (nativePrice) {
        totalValue += parseFloat(wallet.balance) * nativePrice.priceUsd;
      }
      
      // Add token values
      tokenBalances.forEach(tokenBalance => {
        const price = priceData[tokenBalance.token.symbol];
        if (price) {
          totalValue += parseFloat(tokenBalance.formattedBalance) * price.priceUsd;
        }
      });
      
      setPortfolioValue(totalValue);
    } catch (error) {
      console.error('Portfolio value calculation failed:', error);
    }
  };

  // Check network health periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await walletService.checkNetworkHealth();
        setNetworkHealth(health);
      } catch (error) {
        console.error('Network health check failed:', error);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [wallet?.chainId]);

  // Auto-refresh token balances when wallet changes
  useEffect(() => {
    if (wallet) {
      refreshTokenBalances();
    } else {
      setTokenBalances([]);
    }
  }, [wallet?.address, wallet?.chainId]);

  // Auto-refresh prices when wallet changes
  useEffect(() => {
    if (wallet) {
      refreshPrices();
    } else {
      setPriceData({});
      setPortfolioValue(0);
    }
  }, [wallet?.address, wallet?.chainId]);

  // Periodically refresh prices
  useEffect(() => {
    if (!wallet) return;
    
    const interval = setInterval(() => {
      refreshPrices();
    }, 600000); // Refresh every 10 minutes to reduce API calls

    return () => clearInterval(interval);
  }, [wallet?.address, wallet?.chainId]);

  // Calculate portfolio value when prices or balances change
  useEffect(() => {
    calculatePortfolioValue();
  }, [wallet, priceData, tokenBalances]);

  // Custom setWallet that respects preferred network
  const setWalletWithNetwork = (walletInfo: WalletInfo | null) => {
    if (walletInfo) {
      // Check if there's a preferred network stored
      const preferredNetwork = localStorage.getItem('preferredNetwork');
      if (preferredNetwork) {
        const chainId = parseInt(preferredNetwork);
        // Switch to preferred network if it's different from current
        if (chainId !== walletInfo.chainId) {
          walletService.switchNetwork(chainId).then((success) => {
            if (success) {
              const updatedWallet = {
                ...walletInfo,
                chainId,
                chain: walletService.getCurrentChain()
              };
              setWallet(updatedWallet);
              // Clear the preference after applying it
              localStorage.removeItem('preferredNetwork');
            } else {
              setWallet(walletInfo);
            }
          });
          return;
        }
      }
    }
    setWallet(walletInfo);
  };

  return (
    <Web3Context.Provider
      value={{
        wallet,
        isConnecting,
        isConnected: !!wallet,
        tokenBalances,
        isLoadingTokens,
        currentUserSession,
        priceData,
        isLoadingPrices,
        portfolioValue,
        setWallet: setWalletWithNetwork,
        setCurrentUserSession,
        refreshBalance,
        refreshTokenBalances,
        refreshPrices,
        networkHealth,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}