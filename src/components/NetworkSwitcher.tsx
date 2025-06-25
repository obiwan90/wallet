'use client';

import { useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Check, AlertCircle } from 'lucide-react';
import { NETWORKS, walletService } from '@/lib/web3';
import { toast } from 'sonner';

export function NetworkSwitcher() {
  const { wallet, isConnected } = useWeb3();
  const [isLoading, setIsLoading] = useState<number | null>(null);

  const switchNetwork = async (chainId: number) => {
    if (!isConnected) return;

    setIsLoading(chainId);
    try {
      const success = await walletService.switchNetwork(chainId);
      if (success) {
        toast.success(`Switched to ${NETWORKS[chainId as keyof typeof NETWORKS].name}`);
      } else {
        toast.error('Failed to switch network');
      }
    } catch (error) {
      toast.error('Failed to switch network');
    } finally {
      setIsLoading(null);
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Connect your wallet to switch networks</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Network Selection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(NETWORKS).map(([chainId, network]) => {
            const id = parseInt(chainId);
            const isCurrentNetwork = wallet?.chainId === id;
            const isLoading_ = isLoading === id;

            return (
              <div
                key={chainId}
                className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${isCurrentNetwork ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">{network.symbol[0]}</span>
                  </div>
                  <div>
                    <div className="font-medium">{network.name}</div>
                    <div className="text-sm text-muted-foreground">{network.symbol}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCurrentNetwork && (
                    <Badge variant="default" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}

                  {!isCurrentNetwork && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => switchNetwork(id)}
                      disabled={isLoading_ || isCurrentNetwork}
                    >
                      {isLoading_ ? 'Switching...' : 'Switch'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <div className="font-medium mb-1">Network Switch Info:</div>
              <ul className="space-y-1 text-xs">
                <li>• Switching networks will update the current connection</li>
                <li>• Make sure you have the native token for gas fees</li>
                <li>• Different networks have different transaction costs</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}