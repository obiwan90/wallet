'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, ArrowUpRight, ArrowDownLeft, ExternalLink, Copy } from 'lucide-react';
import { NETWORKS, formatAddress } from '@/lib/web3';
import { formatTime } from '@/lib/utils';
import { toast } from 'sonner';

interface Transaction {
  hash: string;
  type: 'send' | 'receive';
  amount: string;
  to: string;
  from: string;
  timestamp: number;
  status: 'success' | 'pending' | 'failed';
  gasUsed?: string;
}

export function TransactionHistory() {
  const { wallet, isConnected } = useWeb3();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const networkSymbol = wallet ? NETWORKS[wallet.chainId as keyof typeof NETWORKS]?.symbol || 'ETH' : 'ETH';

  useEffect(() => {
    if (isConnected && wallet) {
      // Mock transaction data - in a real app, you'd fetch from blockchain API
      const mockTransactions: Transaction[] = [
        {
          hash: '0x1234567890abcdef1234567890abcdef12345678',
          type: 'send',
          amount: '0.5',
          to: '0xabcdef1234567890abcdef1234567890abcdef12',
          from: wallet.address,
          timestamp: Date.now() - 3600000, // 1 hour ago
          status: 'success',
          gasUsed: '21000',
        },
        {
          hash: '0xabcdef1234567890abcdef1234567890abcdef12',
          type: 'receive',
          amount: '1.2',
          to: wallet.address,
          from: '0x1234567890abcdef1234567890abcdef12345678',
          timestamp: Date.now() - 7200000, // 2 hours ago
          status: 'success',
          gasUsed: '21000',
        },
        {
          hash: '0x9876543210fedcba9876543210fedcba98765432',
          type: 'send',
          amount: '0.1',
          to: '0xfedcba0987654321fedcba0987654321fedcba09',
          from: wallet.address,
          timestamp: Date.now() - 86400000, // 1 day ago
          status: 'success',
          gasUsed: '21000',
        },
      ];

      setTransactions(mockTransactions);
    }
  }, [wallet, isConnected]);

  const copyHash = async (hash: string) => {
    await navigator.clipboard.writeText(hash);
    toast.success('Transaction hash copied');
  };

  const openEtherscan = (hash: string) => {
    const baseUrl = wallet?.chainId === 1 ? 'https://etherscan.io' : 'https://etherscan.io'; // Simplified
    window.open(`${baseUrl}/tx/${hash}`, '_blank');
  };

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Connect your wallet to view transaction history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.hash} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'send' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                    }`}>
                    {tx.type === 'send' ? (
                      <ArrowUpRight className="h-5 w-5" />
                    ) : (
                      <ArrowDownLeft className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {tx.type === 'send' ? 'Sent' : 'Received'}
                      <Badge
                        variant={
                          tx.status === 'success' ? 'default' :
                            tx.status === 'pending' ? 'secondary' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {tx.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tx.type === 'send' ? 'To: ' : 'From: '}
                      <code>{formatAddress(tx.type === 'send' ? tx.to : tx.from)}</code>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(tx.timestamp)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-medium ${tx.type === 'send' ? 'text-red-600' : 'text-green-600'
                    }`}>
                    {tx.type === 'send' ? '-' : '+'}{tx.amount} {networkSymbol}
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
                      onClick={() => openEtherscan(tx.hash)}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}