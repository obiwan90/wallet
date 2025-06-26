"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TokenPrice, formatPrice, formatChange, formatMarketCap } from '@/lib/price-service';

interface PriceCardProps {
  tokenSymbol: string;
  price: TokenPrice | null;
  isLoading?: boolean;
  className?: string;
}

export function PriceCard({ tokenSymbol, price, isLoading = false, className }: PriceCardProps) {
  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-muted rounded w-16"></div>
            <div className="h-4 bg-muted rounded w-12"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-7 bg-muted rounded w-24"></div>
            <div className="h-4 bg-muted rounded w-20"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!price) {
    return (
      <Card className={cn("opacity-50", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {tokenSymbol}
            <Badge variant="outline" className="text-xs">No Data</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Price data unavailable
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = price.change24h >= 0;
  const changeColor = isPositive ? "text-green-600" : "text-red-600";
  const changeBgColor = isPositive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{tokenSymbol}</CardTitle>
            <Badge 
              variant="outline" 
              className={cn("text-xs", changeBgColor, changeColor)}
            >
              {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {formatChange(price.change24h)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div>
            <div className="text-2xl font-bold">
              {formatPrice(price.priceUsd)}
            </div>
            <div className="text-xs text-muted-foreground">
              USD Price
            </div>
          </div>

          {price.marketCap && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Market Cap:</span>
              <span className="font-medium">{formatMarketCap(price.marketCap)}</span>
            </div>
          )}

          {price.volume24h && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">24h Volume:</span>
              <span className="font-medium">{formatMarketCap(price.volume24h)}</span>
            </div>
          )}

          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Last Updated:</span>
            <span className="font-medium">
              {new Date(price.lastUpdated).toLocaleTimeString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface PriceGridProps {
  priceData: Record<string, TokenPrice>;
  symbols: string[];
  isLoading?: boolean;
  className?: string;
}

export function PriceGrid({ priceData, symbols, isLoading = false, className }: PriceGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {symbols.map((symbol) => (
        <PriceCard
          key={symbol}
          tokenSymbol={symbol}
          price={priceData[symbol] || null}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}

interface MarketOverviewProps {
  priceData: Record<string, TokenPrice>;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function MarketOverview({ priceData, isLoading = false, onRefresh, className }: MarketOverviewProps) {
  const topSymbols = ['ETH', 'BTC', 'USDC', 'USDT', 'BNB', 'MATIC'];
  const availableSymbols = topSymbols.filter(symbol => priceData[symbol]);
  
  // Check if data appears to be mock data (when change values are very random-looking)
  const isMockData = availableSymbols.length > 0 && 
    availableSymbols.some(symbol => {
      const price = priceData[symbol];
      return price && Math.abs(price.change24h) > 8; // Mock data tends to have larger random changes
    });

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Market Overview
            {isMockData && (
              <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700">
                Demo Data
              </Badge>
            )}
          </CardTitle>
          {onRefresh && (
            <motion.button
              onClick={onRefresh}
              disabled={isLoading}
              className={cn(
                "p-2 rounded-lg hover:bg-muted transition-colors",
                isLoading && "cursor-not-allowed"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </motion.button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {availableSymbols.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No market data available</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-2 text-primary hover:underline"
              >
                Try refreshing
              </button>
            )}
          </div>
        ) : (
          <PriceGrid 
            priceData={priceData} 
            symbols={availableSymbols} 
            isLoading={isLoading}
          />
        )}
      </CardContent>
    </Card>
  );
}