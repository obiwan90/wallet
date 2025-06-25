'use client';

import { useState } from 'react';
import { AssetList } from '@/components/AssetList';
import { SendTransaction } from '@/components/SendTransaction';
import { TransactionHistory } from '@/components/TransactionHistory';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { WalletManager } from '@/components/WalletManager';
import { MagicPanel } from '@/components/MagicPanel';
import { WalletLogin } from '@/components/WalletLogin';
import { useWeb3 } from '@/contexts/Web3Context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, History, Send, Sparkles, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { isConnected, setWallet } = useWeb3();
  const [activeTab, setActiveTab] = useState('overview');

  const handleWalletConnected = () => {
    // Wallet is now connected, the main app will re-render
  };

  const handleLogout = () => {
    setWallet(null);
    setActiveTab('overview');
  };

  // Show login page if no wallet is connected
  if (!isConnected) {
    return <WalletLogin onWalletConnected={handleWalletConnected} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8 relative">
          <div className="absolute top-0 right-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Magic Wallet
          </h1>
          <p className="text-muted-foreground">
            Smart Web3 Wallet - Create, import, and manage your digital assets with built-in AI analysis features
          </p>
        </header>

        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Assets
              </TabsTrigger>
              <TabsTrigger value="send" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="wallet" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Manage
              </TabsTrigger>
              <TabsTrigger value="magic" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Magic AI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <AssetList />
              <div className="max-w-2xl mx-auto">
                <NetworkSwitcher />
              </div>
            </TabsContent>

            <TabsContent value="send" className="space-y-6 mt-6">
              <div className="max-w-md mx-auto">
                <SendTransaction />
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6 mt-6">
              <TransactionHistory />
            </TabsContent>

            <TabsContent value="wallet" className="space-y-6 mt-6">
              <WalletManager />
            </TabsContent>

            <TabsContent value="magic" className="space-y-6 mt-6">
              <MagicPanel />
            </TabsContent>
          </Tabs>
        </div>

        <footer className="text-center mt-16 text-sm text-muted-foreground">
          <p>Built with Next.js, Tailwind CSS, and shadcn/ui</p>
        </footer>
      </div>
    </div>
  );
}
