'use client';

import { useState } from 'react';
import { AssetList } from '@/components/AssetList';
import { SendTransaction } from '@/components/SendTransaction';
import { TransactionHistory } from '@/components/TransactionHistory';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { WalletManager } from '@/components/WalletManager';
import { MagicPanel } from '@/components/MagicPanel';
import { useWeb3 } from '@/contexts/Web3Context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, History, Send, Globe, Sparkles } from 'lucide-react';

export default function Home() {
  const { isConnected } = useWeb3();
  const [activeTab, setActiveTab] = useState('wallet');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Magic Wallet
          </h1>
          <p className="text-muted-foreground">
            智能Web3钱包 - 创建、导入、管理您的数字资产，内置AI分析功能
          </p>
        </header>

        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="wallet" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                钱包管理
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                资产概览
              </TabsTrigger>
              <TabsTrigger value="send" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                发送交易
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                交易历史
              </TabsTrigger>
              <TabsTrigger value="magic" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Magic AI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wallet" className="space-y-6 mt-6">
              <WalletManager />
            </TabsContent>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {!isConnected ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    请先在"钱包管理"页面创建或导入钱包
                  </p>
                </div>
              ) : (
                <>
                  <AssetList />
                  <div className="max-w-2xl mx-auto">
                    <NetworkSwitcher />
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="send" className="space-y-6 mt-6">
              {!isConnected ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    请先在"钱包管理"页面创建或导入钱包
                  </p>
                </div>
              ) : (
                <div className="max-w-md mx-auto">
                  <SendTransaction />
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-6 mt-6">
              {!isConnected ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    请先在"钱包管理"页面创建或导入钱包
                  </p>
                </div>
              ) : (
                <TransactionHistory />
              )}
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
