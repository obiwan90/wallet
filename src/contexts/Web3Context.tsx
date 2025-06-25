'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletInfo, walletService } from '@/lib/web3';

interface Web3ContextType {
  wallet: WalletInfo | null;
  isConnecting: boolean;
  isConnected: boolean;
  setWallet: (wallet: WalletInfo | null) => void;
  refreshBalance: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const refreshBalance = async () => {
    if (!wallet) return;
    try {
      const balance = await walletService.getBalance(wallet.address);
      setWallet(prev => prev ? { ...prev, balance } : null);
    } catch (error) {
      // Silently fail balance refresh
    }
  };

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
              setWallet({
                ...walletInfo,
                chainId,
                chain: walletService.getCurrentChain()
              });
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
        setWallet: setWalletWithNetwork,
        refreshBalance,
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