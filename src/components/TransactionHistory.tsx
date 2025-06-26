'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '@/contexts/Web3Context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ExternalLink, 
  Copy, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { walletService, NETWORKS, formatAddress } from '@/lib/web3';
import type { TransactionHistory as TransactionHistoryType } from '@/lib/web3';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function TransactionHistory() {
  const { wallet, isConnected } = useWeb3();
  const [transactions, setTransactions] = useState<TransactionHistoryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const networkSymbol = wallet ? NETWORKS[wallet.chainId as keyof typeof NETWORKS]?.symbol || 'ETH' : 'ETH';

  const loadTransactionHistory = async () => {
    if (!wallet?.address) return;

    setLoading(true);
    setError(null);

    try {
      const history = await walletService.getTransactionHistory(wallet.address, 50);
      const pending = await walletService.getPendingTransactions(wallet.address);
      
      // Combine pending and confirmed transactions
      const allTransactions = [...pending, ...history];
      setTransactions(allTransactions);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
      setError('无法加载交易历史');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && wallet) {
      loadTransactionHistory();
    }
  }, [wallet?.address, isConnected]);

  const copyHash = async (hash: string) => {
    await navigator.clipboard.writeText(hash);
    toast.success('交易哈希已复制');
  };

  const getExplorerUrl = (hash: string, chainId: number) => {
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io/tx/',
      137: 'https://polygonscan.com/tx/',
      56: 'https://bscscan.com/tx/',
      43114: 'https://snowtrace.io/tx/',
      42161: 'https://arbiscan.io/tx/',
      10: 'https://optimistic.etherscan.io/tx/',
      8453: 'https://basescan.org/tx/',
    };
    
    const explorerUrl = explorers[chainId];
    return explorerUrl ? `${explorerUrl}${hash}` : '#';
  };

  const openExplorer = (hash: string, chainId: number) => {
    const url = getExplorerUrl(hash, chainId);
    if (url !== '#') {
      window.open(url, '_blank');
    }
  };

  const getStatusIcon = (status: TransactionHistoryType['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: TransactionHistoryType['type']) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'receive':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'contract':
        return <div className="w-4 h-4 bg-blue-500 rounded-full" />;
      default:
        return <div className="w-4 h-4 bg-gray-500 rounded-full" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 2592000000) return `${Math.floor(diff / 86400000)}天前`;
    
    return date.toLocaleDateString('zh-CN');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">连接钱包以查看交易历史</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            交易历史
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTransactionHistory}
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            刷新
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            {error}
          </div>
        )}

        <ScrollArea className="h-[400px]">
          <AnimatePresence>
            {loading && transactions.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <History className="w-8 h-8 mb-2" />
                <p>暂无交易记录</p>
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {transactions.map((tx, index) => (
                  <motion.div
                    key={`${tx.hash}-${index}`}
                    variants={itemVariants}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(tx.status)}
                        {getTypeIcon(tx.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {tx.type === 'send' ? '发送' : tx.type === 'receive' ? '接收' : '合约'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {tx.status === 'success' ? '成功' : tx.status === 'failed' ? '失败' : '待确认'}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {tx.type === 'send' ? '至' : '来自'}: {formatAddress(tx.type === 'send' ? tx.to : tx.from)}
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(tx.timestamp)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={cn(
                          "text-sm font-medium",
                          tx.type === 'send' ? 'text-red-500' : 'text-green-500'
                        )}>
                          {tx.type === 'send' ? '-' : '+'}{tx.formattedValue} {networkSymbol}
                        </div>
                        {tx.tokenSymbol && (
                          <div className="text-xs text-muted-foreground">
                            {tx.tokenAmount} {tx.tokenSymbol}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyHash(tx.hash)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openExplorer(tx.hash, tx.chainId)}
                          className="h-6 w-6 p-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}