"use client";

import * as React from "react";
import { Globe, ChevronDown, Zap, CheckCircle } from "lucide-react";
import { useWeb3 } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { NETWORKS, walletService } from "@/lib/web3";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function NetworkSelector() {
  const { wallet, isConnected, setWallet } = useWeb3();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [networkStatuses, setNetworkStatuses] = React.useState<Record<number, 'online' | 'offline' | 'checking'>>({});

  const currentNetwork = wallet && wallet.chainId ? NETWORKS[wallet.chainId as keyof typeof NETWORKS] : NETWORKS[1]; // Default to Ethereum

  // Check network connectivity status
  React.useEffect(() => {
    const checkNetworkStatus = async () => {
      const statusChecks = Object.keys(NETWORKS).map(async (chainId) => {
        const networkId = parseInt(chainId);
        setNetworkStatuses(prev => ({ ...prev, [networkId]: 'checking' }));
        
        try {
          // Simple RPC call to check if network is responsive
          const response = await fetch(NETWORKS[networkId as keyof typeof NETWORKS].rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_blockNumber',
              params: [],
              id: 1
            })
          });
          
          if (response.ok) {
            setNetworkStatuses(prev => ({ ...prev, [networkId]: 'online' }));
          } else {
            setNetworkStatuses(prev => ({ ...prev, [networkId]: 'offline' }));
          }
        } catch (error) {
          setNetworkStatuses(prev => ({ ...prev, [networkId]: 'offline' }));
        }
      });
      
      await Promise.all(statusChecks);
    };

    if (isOpen) {
      checkNetworkStatus();
    }
  }, [isOpen]);

  const switchNetwork = async (chainId: number) => {
    if (!isConnected) {
      // When not connected, update the default network preference
      toast.info(`Selected ${NETWORKS[chainId as keyof typeof NETWORKS].name} (will connect after wallet unlock)`);
      // Store the preferred network for after connection
      localStorage.setItem('preferredNetwork', chainId.toString());
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const success = await walletService.switchNetwork(chainId);
      if (success) {
        // Update wallet context with new chain info
        if (wallet) {
          setWallet({
            ...wallet,
            chainId,
            chain: walletService.getCurrentChain()
          });
        }
        
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Switched to {NETWORKS[chainId as keyof typeof NETWORKS].name}</span>
          </div>
        );
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

  const getNetworkStatusIcon = (chainId: number) => {
    const status = networkStatuses[chainId];
    switch (status) {
      case 'online':
        return <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />;
      case 'offline':
        return <div className="w-2 h-2 rounded-full bg-red-500" />;
      case 'checking':
        return <div className="w-2 h-2 rounded-full bg-yellow-500 animate-spin" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-400" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center gap-2 text-sm dark:bg-black/20 dark:border-black/30 dark:hover:bg-black/30 transition-all duration-200"
        disabled={isLoading}
      >
        <div className="flex items-center gap-2">
          <Globe className={cn("h-4 w-4", isLoading && "animate-spin")} />
          <div 
            className="w-2 h-2 rounded-full hidden sm:block"
            style={{ backgroundColor: currentNetwork?.color || '#627EEA' }}
          />
        </div>
        <span className="hidden sm:inline font-medium">
          {currentNetwork?.name || 'Unknown'}
        </span>
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden dark:bg-black/95 dark:border-black/30">
            <div className="p-3 border-b border-white/10 dark:border-black/20">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Select Network
              </h3>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {Object.entries(NETWORKS).map(([chainId, network]) => {
                const networkId = Number(chainId);
                const isActive = wallet?.chainId === networkId;
                const networkStatus = networkStatuses[networkId];
                
                return (
                  <button
                    key={chainId}
                    onClick={() => switchNetwork(networkId)}
                    disabled={isLoading || isActive}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-white/10 disabled:cursor-not-allowed flex items-center gap-3 text-sm transition-all duration-150 dark:hover:bg-black/20",
                      isActive && "bg-white/20 dark:bg-black/40",
                      networkStatus === 'offline' && "opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: network.color }}
                      >
                        {network.symbol.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {network.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <span>{network.symbol}</span>
                          {networkStatus === 'offline' && (
                            <span className="text-red-500">• Offline</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getNetworkStatusIcon(networkId)}
                      {isActive && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="p-3 border-t border-white/10 dark:border-black/20 bg-white/5 dark:bg-black/10">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                {isConnected ? 'Connected' : 'Network preference will apply after wallet unlock'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}