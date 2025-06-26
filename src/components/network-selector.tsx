"use client";

import * as React from "react";
import { Globe, ChevronDown, Zap, CheckCircle, Plus, Settings, Trash2, TestTube, X } from "lucide-react";
import { useWeb3 } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NETWORKS, walletService, type NetworkInfo } from "@/lib/web3";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function NetworkSelector() {
  const { wallet, isConnected, setWallet } = useWeb3();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showAddNetwork, setShowAddNetwork] = React.useState(false);
  const [showTestnets, setShowTestnets] = React.useState(false);
  const [networkStatuses, setNetworkStatuses] = React.useState<Record<number, 'online' | 'offline' | 'checking'>>({});
  const [allNetworks, setAllNetworks] = React.useState<Record<number, NetworkInfo>>({});
  
  // Custom network form state
  const [newNetwork, setNewNetwork] = React.useState({
    name: '',
    symbol: '',
    chainId: '',
    rpcUrl: '',
    color: '#627EEA'
  });

  const currentNetwork = wallet && wallet.chainId ? allNetworks[wallet.chainId] : allNetworks[1]; // Default to Ethereum

  // Load all networks on mount
  React.useEffect(() => {
    setAllNetworks(walletService.getAllNetworks());
  }, []);

  // Check network connectivity status
  React.useEffect(() => {
    const checkNetworkStatus = async () => {
      const statusChecks = Object.keys(allNetworks).map(async (chainId) => {
        const networkId = parseInt(chainId);
        setNetworkStatuses(prev => ({ ...prev, [networkId]: 'checking' }));
        
        try {
          // Simple RPC call to check if network is responsive
          const response = await fetch(allNetworks[networkId].rpcUrls[0], {
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

    if (isOpen && Object.keys(allNetworks).length > 0) {
      checkNetworkStatus();
    }
  }, [isOpen, allNetworks]);

  const switchNetwork = async (chainId: number) => {
    if (!isConnected) {
      // When not connected, update the default network preference
      toast.info(`Selected ${allNetworks[chainId]?.name} (will connect after wallet unlock)`);
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
            <span>Switched to {allNetworks[chainId]?.name}</span>
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

  const addCustomNetwork = () => {
    if (!newNetwork.name || !newNetwork.symbol || !newNetwork.chainId || !newNetwork.rpcUrl) {
      toast.error('Please fill in all required fields');
      return;
    }

    const chainId = parseInt(newNetwork.chainId);
    if (isNaN(chainId) || chainId <= 0) {
      toast.error('Invalid Chain ID');
      return;
    }

    if (allNetworks[chainId]) {
      toast.error('Network with this Chain ID already exists');
      return;
    }

    try {
      // Create a custom chain object
      const customChain = {
        id: chainId,
        name: newNetwork.name,
        nativeCurrency: {
          name: newNetwork.symbol,
          symbol: newNetwork.symbol,
          decimals: 18
        },
        rpcUrls: {
          default: { http: [newNetwork.rpcUrl] },
          public: { http: [newNetwork.rpcUrl] }
        }
      };

      walletService.addCustomNetwork({
        name: newNetwork.name,
        symbol: newNetwork.symbol,
        chain: customChain,
        color: newNetwork.color,
        rpcUrls: [newNetwork.rpcUrl],
        chainId
      });

      // Refresh networks
      setAllNetworks(walletService.getAllNetworks());
      
      // Reset form
      setNewNetwork({
        name: '',
        symbol: '',
        chainId: '',
        rpcUrl: '',
        color: '#627EEA'
      });
      
      setShowAddNetwork(false);
      toast.success(`Added ${newNetwork.name} network`);
    } catch (error) {
      toast.error('Failed to add custom network');
    }
  };

  const removeCustomNetwork = (chainId: number) => {
    try {
      walletService.removeCustomNetwork(chainId);
      setAllNetworks(walletService.getAllNetworks());
      toast.success('Custom network removed');
    } catch (error) {
      toast.error('Failed to remove custom network');
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

  // Filter networks by type
  const mainnets = Object.entries(allNetworks).filter(([_, network]) => !network.isTestnet && !network.isCustom);
  const testnets = Object.entries(allNetworks).filter(([_, network]) => network.isTestnet);
  const customNetworks = Object.entries(allNetworks).filter(([_, network]) => network.isCustom);

  const renderNetworkItem = (chainId: string, network: NetworkInfo) => {
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
            <div className="font-medium text-gray-900 dark:text-gray-100 truncate flex items-center gap-2">
              {network.name}
              {network.isTestnet && <Badge variant="secondary" className="text-xs">测试</Badge>}
              {network.isCustom && <Badge variant="outline" className="text-xs">自定义</Badge>}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <span>{network.symbol}</span>
              {networkStatus === 'offline' && (
                <span className="text-red-500">• 离线</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getNetworkStatusIcon(networkId)}
          {network.isCustom && (
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                removeCustomNetwork(networkId);
              }}
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </Button>
          )}
          {isActive && (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
        </div>
      </button>
    );
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
          <div className="absolute top-full left-0 mt-2 w-80 bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden dark:bg-black/95 dark:border-black/30">
            {!showAddNetwork ? (
              <>
                <div className="p-3 border-b border-white/10 dark:border-black/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      选择网络
                    </h3>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6"
                        onClick={() => setShowTestnets(!showTestnets)}
                        title={showTestnets ? "隐藏测试网络" : "显示测试网络"}
                      >
                        <TestTube className={cn("w-3 h-3", showTestnets && "text-orange-500")} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6"
                        onClick={() => setShowAddNetwork(true)}
                        title="添加自定义网络"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {/* Mainnets */}
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">主网</div>
                    {mainnets.map(([chainId, network]) => renderNetworkItem(chainId, network))}
                  </div>

                  {/* Testnets */}
                  {showTestnets && testnets.length > 0 && (
                    <>
                      <Separator />
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 flex items-center gap-1">
                          <TestTube className="w-3 h-3" />
                          测试网络
                        </div>
                        {testnets.map(([chainId, network]) => renderNetworkItem(chainId, network))}
                      </div>
                    </>
                  )}

                  {/* Custom Networks */}
                  {customNetworks.length > 0 && (
                    <>
                      <Separator />
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 flex items-center gap-1">
                          <Settings className="w-3 h-3" />
                          自定义网络
                        </div>
                        {customNetworks.map(([chainId, network]) => renderNetworkItem(chainId, network))}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="p-3 border-t border-white/10 dark:border-black/20 bg-white/5 dark:bg-black/10">
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    {isConnected ? '已连接' : '钱包解锁后将应用网络偏好'}
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Add Custom Network Form */}
                <div className="p-3 border-b border-white/10 dark:border-black/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      添加自定义网络
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6"
                      onClick={() => setShowAddNetwork(false)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    <Label htmlFor="network-name">网络名称 *</Label>
                    <Input
                      id="network-name"
                      placeholder="例如: Ethereum"
                      value={newNetwork.name}
                      onChange={(e) => setNewNetwork(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="network-symbol">原生币符号 *</Label>
                    <Input
                      id="network-symbol"
                      placeholder="例如: ETH"
                      value={newNetwork.symbol}
                      onChange={(e) => setNewNetwork(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="network-chainid">链 ID *</Label>
                    <Input
                      id="network-chainid"
                      type="number"
                      placeholder="例如: 1"
                      value={newNetwork.chainId}
                      onChange={(e) => setNewNetwork(prev => ({ ...prev, chainId: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="network-rpc">RPC URL *</Label>
                    <Input
                      id="network-rpc"
                      placeholder="https://..."
                      value={newNetwork.rpcUrl}
                      onChange={(e) => setNewNetwork(prev => ({ ...prev, rpcUrl: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="network-color">主题色</Label>
                    <Input
                      id="network-color"
                      type="color"
                      value={newNetwork.color}
                      onChange={(e) => setNewNetwork(prev => ({ ...prev, color: e.target.value }))}
                      className="h-10 w-full"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddNetwork(false)}
                      className="flex-1"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={addCustomNetwork}
                      className="flex-1"
                      disabled={!newNetwork.name || !newNetwork.symbol || !newNetwork.chainId || !newNetwork.rpcUrl}
                    >
                      添加网络
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}