"use client";

import * as React from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useWeb3 } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { NETWORKS, walletService } from "@/lib/web3";
import { toast } from "sonner";

export function NetworkSelector() {
  const { wallet, isConnected } = useWeb3();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const currentNetwork = wallet && wallet.chainId ? NETWORKS[wallet.chainId as keyof typeof NETWORKS] : NETWORKS[1]; // Default to Ethereum

  const switchNetwork = async (chainId: number) => {
    if (!isConnected) {
      // When not connected, just show a preview of the network
      toast.info(`Selected ${NETWORKS[chainId as keyof typeof NETWORKS].name} (will connect after wallet unlock)`);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const success = await walletService.switchNetwork(chainId);
      if (success) {
        toast.success(`Switched to ${NETWORKS[chainId as keyof typeof NETWORKS].name}`);
        setIsOpen(false);
      } else {
        toast.error('Failed to switch network');
      }
    } catch (error) {
      toast.error('Failed to switch network');
    } finally {
      setIsLoading(false);
    }
  };

  // Show network selector even when not connected, but with limited functionality
  const showNetworkSelector = true;

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center gap-2 text-sm dark:bg-black/20 dark:border-black/30 dark:hover:bg-black/30"
        disabled={isLoading}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">
          {currentNetwork?.name || 'Unknown'}
        </span>
        <ChevronDown className="h-3 w-3" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-48 bg-white/90 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg z-50 overflow-hidden dark:bg-black/90 dark:border-black/30">
            {Object.entries(NETWORKS).map(([chainId, network]) => (
              <button
                key={chainId}
                onClick={() => switchNetwork(Number(chainId))}
                disabled={isLoading || wallet?.chainId === Number(chainId)}
                className="w-full px-4 py-3 text-left hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-sm transition-colors dark:hover:bg-black/20"
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: network.color }}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{network.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{network.symbol}</div>
                </div>
                {wallet?.chainId === Number(chainId) && (
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}