'use client';

import { useState } from 'react';
import { WalletLogin } from '@/components/WalletLogin';
import { WalletDashboard } from '@/components/ui/wallet-dashboard';
import { ThemeToggle } from '@/components/theme-toggle';
import { useWeb3 } from '@/contexts/Web3Context';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { isConnected, setWallet } = useWeb3();

  const handleWalletConnected = () => {
    // Wallet is now connected, the main app will re-render
  };

  const handleLogout = () => {
    setWallet(null);
  };

  // Show login page if no wallet is connected
  if (!isConnected) {
    return <WalletLogin onWalletConnected={handleWalletConnected} />;
  }

  return (
    <div className="min-h-screen">
      {/* Main Wallet Dashboard */}
      <WalletDashboard />
    </div>
  );
}
