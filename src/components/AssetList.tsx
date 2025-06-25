'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Coins, TrendingUp, TrendingDown } from 'lucide-react';
import { NETWORKS } from '@/lib/web3';

interface Asset {
  symbol: string;
  name: string;
  balance: string;
  value: number;
  change24h: number;
  icon?: string;
}

export function AssetList() {
  const { wallet, isConnected } = useWeb3();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    if (isConnected && wallet) {
      // Mock asset data - in a real app, you'd fetch from an API
      const networkSymbol = NETWORKS[wallet.chainId as keyof typeof NETWORKS]?.symbol || 'ETH';
      const mockAssets: Asset[] = [
        {
          symbol: networkSymbol,
          name: `${networkSymbol} Balance`,
          balance: wallet.balance,
          value: parseFloat(wallet.balance) * (networkSymbol === 'ETH' ? 2500 : 1), // Mock prices
          change24h: Math.random() * 10 - 5, // Random change between -5% and 5%
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          balance: '1250.00',
          value: 1250,
          change24h: 0.01,
        },
        {
          symbol: 'UNI',
          name: 'Uniswap',
          balance: '45.2',
          value: 45.2 * 8.5,
          change24h: 3.2,
        },
      ];
      
      setAssets(mockAssets);
      setTotalValue(mockAssets.reduce((sum, asset) => sum + asset.value, 0));
    }
  }, [wallet, isConnected]);

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Connect your wallet to view assets</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold">${totalValue.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Portfolio Value</div>
            </div>
            
            <div className="space-y-2">
              {assets.map((asset) => {
                const percentage = (asset.value / totalValue) * 100;
                return (
                  <div key={asset.symbol} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{asset.symbol}</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assets.map((asset) => (
              <div key={asset.symbol} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-sm">{asset.symbol[0]}</span>
                  </div>
                  <div>
                    <div className="font-medium">{asset.name}</div>
                    <div className="text-sm text-muted-foreground">{asset.symbol}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium">{parseFloat(asset.balance).toFixed(4)} {asset.symbol}</div>
                  <div className="text-sm text-muted-foreground">${asset.value.toFixed(2)}</div>
                  <Badge 
                    variant={asset.change24h >= 0 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {asset.change24h >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(asset.change24h).toFixed(2)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}