"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  MoreHorizontal,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  Copy,
  ExternalLink,
  ChevronRight,
  DollarSign,
  PieChart,
  Activity,
  Clock,
  LogOut,
  Book
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import { NetworkSelector } from '@/components/network-selector';
import { SendModal } from '@/components/SendModal';
import { AccountSwitcher } from '@/components/AccountSwitcher';
import { TransactionHistory } from '@/components/TransactionHistory';
import { ReceiveModal } from '@/components/ReceiveModal';
import { AddressBook } from '@/components/AddressBook';
import { useWeb3 } from '@/contexts/Web3Context';
import { NETWORKS } from '@/lib/web3';

// Hook for click outside functionality
function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  mouseEvent: 'mousedown' | 'mouseup' = 'mousedown'
): void {
  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;
      const target = event.target;

      if (!el || !target || el.contains(target as Node)) {
        return;
      }

      handler(event);
    };

    document.addEventListener(mouseEvent, listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener(mouseEvent, listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, mouseEvent]);
}

// Button Group Component
const buttonGroupVariants = {
  default: "flex sm:items-center max-sm:gap-2 max-sm:flex-col [&>*:focus-within]:ring-1 [&>*:focus-within]:z-10 [&>*]:ring-offset-0 sm:[&>*:not(:first-child)]:rounded-l-none sm:[&>*:not(:last-child)]:rounded-r-none [&>*]:h-11 sm:[&>*]:h-12 [&>*]:px-3 sm:[&>*]:px-4 [&>*]:py-2 sm:[&>*]:py-3",
};

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  separated?: boolean;
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ children, className, separated = false, ...props }, ref) => {
    return (
      <div
        className={cn(buttonGroupVariants.default, className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ButtonGroup.displayName = "ButtonGroup";

// Grid Pattern Card Components
interface GridPatternCardProps {
  children: React.ReactNode;
  className?: string;
  patternClassName?: string;
  gradientClassName?: string;
}

function GridPatternCard({
  children,
  className,
  patternClassName,
  gradientClassName
}: GridPatternCardProps) {
  return (
    <motion.div
      className={cn(
        "border w-full rounded-md overflow-hidden",
        "bg-white dark:bg-zinc-950",
        "border-zinc-200 dark:border-zinc-900",
        className
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className={cn(
        "size-full bg-repeat bg-[length:50px_50px]",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3E%3Cg stroke-width='3.5' stroke='hsla(215, 16%25, 47%25, 1.00)' fill='none'%3E%3Crect width='400' height='400' x='0' y='0'%3E%3C/rect%3E%3Crect width='400' height='400' x='400' y='0'%3E%3C/rect%3E%3Crect width='400' height='400' x='800' y='0'%3E%3C/rect%3E%3Crect width='400' height='400' x='0' y='400'%3E%3C/rect%3E%3Crect width='400' height='400' x='400' y='400'%3E%3C/rect%3E%3Crect width='400' height='400' x='800' y='400'%3E%3C/rect%3E%3Crect width='400' height='400' x='0' y='800'%3E%3C/rect%3E%3Crect width='400' height='400' x='400' y='800'%3E%3C/rect%3E%3Crect width='400' height='400' x='800' y='800'%3E%3C/rect%3E%3C/g%3E%3C/svg%3E\")] dark:bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3E%3Cg stroke-width='3.5' stroke='hsla(0, 0%25, 100%25, 1.00)' fill='none'%3E%3Crect width='400' height='400' x='0' y='0'%3E%3C/rect%3E%3Crect width='400' height='400' x='400' y='0'%3E%3C/rect%3E%3Crect width='400' height='400' x='800' y='0'%3E%3C/rect%3E%3Crect width='400' height='400' x='0' y='400'%3E%3C/rect%3E%3Crect width='400' height='400' x='400' y='400'%3E%3C/rect%3E%3Crect width='400' height='400' x='800' y='400'%3E%3C/rect%3E%3Crect width='400' height='400' x='0' y='800'%3E%3C/rect%3E%3Crect width='400' height='400' x='400' y='800'%3E%3C/rect%3E%3Crect width='400' height='400' x='800' y='800'%3E%3C/rect%3E%3C/g%3E%3C/svg%3E\")]",
        patternClassName
      )}>
        <div className={cn(
          "size-full bg-gradient-to-tr",
          "from-white via-white/[0.85] to-white",
          "dark:from-zinc-950 dark:via-zinc-950/[.85] dark:to-zinc-950",
          gradientClassName
        )}>
          {children}
        </div>
      </div>
    </motion.div>
  );
}

function GridPatternCardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-left p-4 md:p-6", className)}
      {...props}
    />
  );
}

// Types
interface Asset {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  balance: string;
  value: number;
  price: number;
  change24h: number;
  allocation: number;
}

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'stake';
  asset: string;
  amount: string;
  value: number;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
  hash: string;
  from?: string;
  to?: string;
}

interface WalletData {
  totalBalance: number;
  change24h: number;
  assets: Asset[];
  transactions: Transaction[];
}

// Mock data
const mockWalletData: WalletData = {
  totalBalance: 24567.89,
  change24h: 5.67,
  assets: [
    {
      id: '1',
      symbol: 'ETH',
      name: 'Ethereum',
      icon: '⟠',
      balance: '8.5432',
      value: 19876.54,
      price: 2326.78,
      change24h: 4.2,
      allocation: 80.8
    },
    {
      id: '2',
      symbol: 'USDC',
      name: 'USD Coin',
      icon: '💵',
      balance: '2,450.00',
      value: 2450.00,
      price: 1.00,
      change24h: 0.1,
      allocation: 10.0
    },
    {
      id: '3',
      symbol: 'UNI',
      name: 'Uniswap',
      icon: '🦄',
      balance: '156.78',
      value: 1324.59,
      price: 8.45,
      change24h: -2.1,
      allocation: 5.4
    },
    {
      id: '4',
      symbol: 'LINK',
      name: 'Chainlink',
      icon: '🔗',
      balance: '65.23',
      value: 916.76,
      price: 14.06,
      change24h: 7.3,
      allocation: 3.8
    }
  ],
  transactions: [
    {
      id: '1',
      type: 'receive',
      asset: 'ETH',
      amount: '0.5',
      value: 1163.39,
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: 'completed',
      hash: '0x1234...5678',
      from: '0xabcd...efgh'
    },
    {
      id: '2',
      type: 'send',
      asset: 'USDC',
      amount: '500.00',
      value: 500.00,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: 'completed',
      hash: '0x2345...6789',
      to: '0xijkl...mnop'
    },
    {
      id: '3',
      type: 'swap',
      asset: 'UNI',
      amount: '25.0',
      value: 211.25,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      status: 'completed',
      hash: '0x3456...7890'
    },
    {
      id: '4',
      type: 'stake',
      asset: 'ETH',
      amount: '2.0',
      value: 4653.56,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: 'pending',
      hash: '0x4567...8901'
    }
  ]
};

// Main Wallet Dashboard Component
export function WalletDashboard() {
  const {
    wallet,
    setWallet,
    tokenBalances,
    isLoadingTokens,
    refreshBalance,
    refreshTokenBalances,
    networkHealth
  } = useWeb3();

  const [walletData] = useState<WalletData>(mockWalletData); // Keep mock for transactions for now
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'assets' | 'transactions'>('assets');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showAddressBook, setShowAddressBook] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setWallet(null);
  };

  const handleRefresh = async () => {
    if (!wallet) return;
    setIsRefreshing(true);
    try {
      await Promise.all([refreshBalance(), refreshTokenBalances()]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate total portfolio value from real data
  const calculateTotalValue = () => {
    if (!wallet) return 0;

    let total = parseFloat(wallet.balance) * 2500; // Assume ETH price for native token

    // Add token values (using mock prices for now)
    tokenBalances.forEach(tokenBalance => {
      const balance = parseFloat(tokenBalance.formattedBalance);
      if (tokenBalance.token.symbol === 'USDC' || tokenBalance.token.symbol === 'USDT') {
        total += balance; // Stablecoins = $1
      } else {
        total += balance * 100; // Other tokens mock price
      }
    });

    return total;
  };

  const totalValue = calculateTotalValue();
  const networkConfig = wallet ? NETWORKS[wallet.chainId as keyof typeof NETWORKS] : null;

  const handleSendClick = () => {
    setShowSendModal(true);
  };

  // Mouse tracking for glow effects
  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    if (isHovering) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHovering]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send': return <ArrowUpRight className="w-4 h-4" />;
      case 'receive': return <ArrowDownLeft className="w-4 h-4" />;
      case 'swap': return <RefreshCw className="w-4 h-4" />;
      case 'stake': return <PieChart className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 25
      }
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <motion.div
        ref={containerRef}
        className="max-w-7xl mx-auto space-y-4 md:space-y-6 lg:space-y-8 pb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Header - 3-tier responsive design */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 w-full"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2 justify-self-start">
            {/* Network selector */}
            <NetworkSelector />
          </div>
          
          <div className="flex flex-col items-center gap-2 justify-self-center">
            <AccountSwitcher />
            <p className="text-muted-foreground text-sm md:text-base lg:text-lg text-center">Manage your digital assets</p>
          </div>

          <div className="flex items-center gap-2 justify-self-end">
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowAddressBook(true)}
            >
              <Book className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </motion.div>

        {/* Portfolio Overview */}
        <motion.div variants={itemVariants}>
          <GridPatternCard className="relative overflow-hidden">
            {/* Animated background glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-lg"
              animate={{
                background: isHovering
                  ? `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, hsl(var(--primary) / 0.15) 0%, hsl(var(--accent) / 0.1) 50%, transparent 70%)`
                  : undefined
              }}
              transition={{ duration: 0.3 }}
            />

            <GridPatternCardBody className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Total Portfolio Value</h2>
                    <p className="text-sm text-muted-foreground">Across all assets</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                >
                  {isBalanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2">
                  <div className="mb-3 sm:mb-4">
                    <motion.div
                      className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {isBalanceVisible ? formatCurrency(totalValue) : '••••••'}
                    </motion.div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {wallet && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <span>{networkConfig?.symbol} Balance: {isBalanceVisible ? wallet.balance : '••••'}</span>
                          {isLoadingTokens && (
                            <div className="animate-spin w-3 h-3 border border-gray-300 border-t-primary rounded-full" />
                          )}
                        </div>
                      )}
                    </div>
                    {wallet && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Address: {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <ButtonGroup>
                    <Button
                      className="flex-1"
                      onClick={handleSendClick}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setShowReceiveModal(true)}
                    >
                      <ArrowDownLeft className="w-4 h-4 mr-2" />
                      Receive
                    </Button>
                  </ButtonGroup>

                  <ButtonGroup>
                    <Button variant="outline" className="flex-1">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Swap
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Plus className="w-4 h-4 mr-2" />
                      Buy
                    </Button>
                  </ButtonGroup>
                </div>
              </div>
            </GridPatternCardBody>
          </GridPatternCard>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit">
            <Button
              variant={selectedTab === 'assets' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('assets')}
              className="relative"
            >
              <PieChart className="w-4 h-4 mr-2" />
              Assets
            </Button>
            <Button
              variant={selectedTab === 'transactions' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('transactions')}
              className="relative"
            >
              <Activity className="w-4 h-4 mr-2" />
              Transactions
            </Button>
          </div>
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {selectedTab === 'assets' ? (
            <motion.div
              key="assets"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6"
            >
              {/* Assets List */}
              <div className="xl:col-span-2">
                <Card className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6 mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-semibold">Your Assets</h3>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Asset
                    </Button>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {/* Native Token */}
                    {wallet && networkConfig && (
                      <motion.div
                        className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={handleSendClick}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <div
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-2xl flex-shrink-0 font-bold text-white"
                            style={{ backgroundColor: networkConfig.color }}
                          >
                            {networkConfig.symbol[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground text-sm sm:text-base">{networkConfig.symbol}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground truncate">{networkConfig.name}</div>
                          </div>
                        </div>

                        <div className="text-right hidden sm:block">
                          <div className="font-semibold text-sm sm:text-base">
                            {isBalanceVisible ? wallet.balance : '••••'}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {isBalanceVisible ? formatCurrency(parseFloat(wallet.balance) * 2500) : '••••'}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="font-semibold text-sm sm:text-base">
                            $2,500
                          </div>
                          <div className="text-xs sm:text-sm flex items-center gap-1 justify-end text-primary">
                            <TrendingUp className="w-3 h-3" />
                            <span className="hidden sm:inline">+2.5%</span>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                      </motion.div>
                    )}

                    {/* ERC-20 Tokens */}
                    {tokenBalances.map((tokenBalance, index) => (
                      <motion.div
                        key={tokenBalance.token.address}
                        className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (index + 1) * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={handleSendClick}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full flex items-center justify-center text-lg sm:text-2xl flex-shrink-0 font-bold">
                            {tokenBalance.token.symbol[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground text-sm sm:text-base">{tokenBalance.token.symbol}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground truncate">{tokenBalance.token.name}</div>
                          </div>
                        </div>

                        <div className="text-right hidden sm:block">
                          <div className="font-semibold text-sm sm:text-base">
                            {isBalanceVisible ? tokenBalance.formattedBalance : '••••'}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {isBalanceVisible ? (
                              tokenBalance.token.symbol === 'USDC' || tokenBalance.token.symbol === 'USDT'
                                ? formatCurrency(parseFloat(tokenBalance.formattedBalance))
                                : formatCurrency(parseFloat(tokenBalance.formattedBalance) * 100)
                            ) : '••••'}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="font-semibold text-sm sm:text-base">
                            {tokenBalance.token.symbol === 'USDC' || tokenBalance.token.symbol === 'USDT' ? '$1.00' : '$100'}
                          </div>
                          <div className="text-xs sm:text-sm flex items-center gap-1 justify-end text-primary">
                            <TrendingUp className="w-3 h-3" />
                            <span className="hidden sm:inline">+1.2%</span>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                      </motion.div>
                    ))}

                    {/* Loading indicator for tokens */}
                    {isLoadingTokens && (
                      <div className="flex items-center justify-center p-4">
                        <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full"></div>
                        <span className="ml-2 text-sm text-muted-foreground">Loading tokens...</span>
                      </div>
                    )}

                    {/* Fallback to mock data if no real tokens */}
                    {!isLoadingTokens && tokenBalances.length === 0 && walletData.assets.map((asset, index) => (
                      <motion.div
                        key={asset.id}
                        className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full flex items-center justify-center text-lg sm:text-2xl flex-shrink-0">
                            {asset.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground text-sm sm:text-base">{asset.symbol}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground truncate">{asset.name}</div>
                          </div>
                        </div>

                        <div className="text-right hidden sm:block">
                          <div className="font-semibold text-sm sm:text-base">
                            {isBalanceVisible ? asset.balance : '••••'}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {isBalanceVisible ? formatCurrency(asset.value) : '••••'}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="font-semibold text-sm sm:text-base">
                            {formatCurrency(asset.price)}
                          </div>
                          <div className={cn(
                            "text-xs sm:text-sm flex items-center gap-1 justify-end",
                            asset.change24h >= 0 ? "text-primary" : "text-destructive"
                          )}>
                            {asset.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span className="hidden sm:inline">{asset.change24h >= 0 ? '+' : ''}{asset.change24h}%</span>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Portfolio Allocation */}
              <div>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Portfolio Allocation</h3>

                  <div className="space-y-4">
                    {walletData.assets.map((asset, index) => (
                      <motion.div
                        key={asset.id}
                        className="space-y-2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{asset.icon}</span>
                            <span className="font-medium">{asset.symbol}</span>
                          </div>
                          <span className="text-muted-foreground">{asset.allocation}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <motion.div
                            className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${asset.allocation}%` }}
                            transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="transactions"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <TransactionHistory />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Send Modal */}
      <SendModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
      />

      {/* Receive Modal */}
      <ReceiveModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
      />

      {/* Address Book */}
      <AddressBook
        isOpen={showAddressBook}
        onClose={() => setShowAddressBook(false)}
        mode="manage"
      />
    </div>
  );
}

// Usage Example
export default function WalletDashboardDemo() {
  return <WalletDashboard />;
}