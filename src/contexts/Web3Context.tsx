'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletInfo, walletService, TokenBalance, getCommonTokensForNetwork } from '@/lib/web3';

interface Web3ContextType {
  wallet: WalletInfo | null;
  isConnecting: boolean;
  isConnected: boolean;
  tokenBalances: TokenBalance[];
  isLoadingTokens: boolean;
  currentUserSession: { accountId: string; password: string } | null;
  setWallet: (wallet: WalletInfo | null) => void;
  setCurrentUserSession: (session: { accountId: string; password: string } | null) => void;
  refreshBalance: () => Promise<void>;
  refreshTokenBalances: () => Promise<void>;
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
        setWallet: setWalletWithNetwork,
        setCurrentUserSession,
        refreshBalance,
        refreshTokenBalances,
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