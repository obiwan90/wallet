'use client';

import { useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Send, AlertTriangle, Info } from 'lucide-react';
import { NETWORKS } from '@/lib/web3';
import { getAddress } from 'viem';
import { toast } from 'sonner';

export function SendTransaction() {
  const { wallet, isConnected } = useWeb3();
  const [isOpen, setIsOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const networkSymbol = wallet ? NETWORKS[wallet.chainId as keyof typeof NETWORKS]?.symbol || 'ETH' : 'ETH';

  const handleSend = async () => {
    if (!wallet || !recipient || !amount) return;

    // Basic validation
    if (parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (parseFloat(amount) > parseFloat(wallet.balance)) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      getAddress(recipient); // This will throw if invalid
    } catch {
      toast.error('Invalid recipient address');
      return;
    }

    // Show coming soon message
    toast.info('交易功能即将推出！目前仅支持钱包管理和资产查看。');
  };

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Connect your wallet to send transactions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Send className="h-4 w-4 mr-2" />
          Send {networkSymbol}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Transaction</DialogTitle>
          <DialogDescription>
            Send {networkSymbol} to another address
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-blue-700">交易功能正在开发中，敬请期待！</span>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">Double-check the recipient address</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Recipient Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Amount ({networkSymbol})</label>
              <Badge variant="secondary" className="text-xs">
                Balance: {parseFloat(wallet!.balance).toFixed(4)} {networkSymbol}
              </Badge>
            </div>
            <input
              type="number"
              placeholder="0.0"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((parseFloat(wallet!.balance) * 0.25).toString())}
              >
                25%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((parseFloat(wallet!.balance) * 0.5).toString())}
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((parseFloat(wallet!.balance) * 0.75).toString())}
              >
                75%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((parseFloat(wallet!.balance) * 0.99).toString())} // Leave some for gas
              >
                Max
              </Button>
            </div>
          </div>

          {amount && recipient && (
            <div className="p-3 bg-muted rounded-lg space-y-1">
              <div className="text-sm font-medium">Transaction Summary:</div>
              <div className="text-sm text-muted-foreground">
                Send {amount} {networkSymbol} to {recipient.slice(0, 6)}...{recipient.slice(-4)}
              </div>
              <div className="text-xs text-muted-foreground">
                Gas fees will be deducted from your balance
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSend}
              disabled={!recipient || !amount}
            >
              Send Transaction
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}