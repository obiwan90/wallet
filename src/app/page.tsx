'use client';

import { WalletLogin } from '@/components/WalletLogin';
import { WalletDashboard } from '@/components/ui/wallet-dashboard';
import { useWeb3 } from '@/contexts/Web3Context';

export default function Home() {
  const { isConnected } = useWeb3();

  const handleWalletConnected = () => {
    // Wallet is now connected, the main app will re-render
  };

  // Show login page if no wallet is connected
  if (!isConnected) {
    return <WalletLogin onWalletConnected={handleWalletConnected} />;
  }

  return (
    <div>
      {/* Main Wallet Dashboard */}
      <WalletDashboard />
    </div>
  );
}
