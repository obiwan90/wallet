"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpDown,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Settings,
  Clock,
  Zap,
  Info,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useWeb3 } from '@/contexts/Web3Context';
import { swapService, type SwapQuote, type SwapParams } from '@/lib/swap-service';
import { walletService, formatAddress, type TokenInfo, getCommonTokensForNetwork } from '@/lib/web3';
import { walletManager } from '@/lib/wallet-manager';
import { toast } from 'sonner';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TokenSelectState {
  fromToken: TokenInfo | null;
  toToken: TokenInfo | null;
}

export function SwapModal({ isOpen, onClose }: SwapModalProps) {
  const { wallet, refreshBalance, refreshTokenBalances } = useWeb3();
  
  // Form states
  const [tokens, setTokens] = useState<TokenSelectState>({ fromToken: null, toToken: null });
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [password, setPassword] = useState('');
  
  // Quote and swap states
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string>('');
  
  // UI states
  const [step, setStep] = useState<'form' | 'confirm' | 'password' | 'swapping' | 'success' | 'error'>('form');
  const [showSettings, setShowSettings] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // Available tokens for current network
  const [availableTokens, setAvailableTokens] = useState<TokenInfo[]>([]);

  // Load available tokens when modal opens
  useEffect(() => {
    if (isOpen && wallet) {
      loadAvailableTokens();
    }
  }, [isOpen, wallet]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setFromAmount('');
      setToAmount('');
      setQuote(null);
      setPassword('');
      setError('');
      setTxHash('');
      setQuoteError('');
    }
  }, [isOpen]);

  // Get quote when form inputs change
  useEffect(() => {
    if (tokens.fromToken && tokens.toToken && fromAmount && parseFloat(fromAmount) > 0) {
      debouncedGetQuote();
    } else {
      setQuote(null);
      setToAmount('');
    }
  }, [tokens.fromToken, tokens.toToken, fromAmount, slippage]);

  const loadAvailableTokens = async () => {
    if (!wallet) return;
    
    try {
      // Get common tokens for current network
      const commonTokens = getCommonTokensForNetwork(wallet.chainId);
      setAvailableTokens(commonTokens);
      
      // Auto-select first token if none selected
      if (!tokens.fromToken && commonTokens.length > 0) {
        setTokens(prev => ({ ...prev, fromToken: commonTokens[0] }));
      }
    } catch (error) {
      console.error('Failed to load available tokens:', error);
    }
  };

  // Debounced quote fetching
  const debouncedGetQuote = useCallback(
    debounce(async () => {
      await getSwapQuote();
    }, 1000),
    [tokens.fromToken, tokens.toToken, fromAmount, slippage]
  );

  const getSwapQuote = async () => {
    if (!tokens.fromToken || !tokens.toToken || !fromAmount || !wallet) return;
    
    setIsLoadingQuote(true);
    setQuoteError('');
    
    try {
      const swapParams: SwapParams = {
        fromToken: tokens.fromToken.address,
        toToken: tokens.toToken.address,
        amount: fromAmount,
        slippage,
        recipient: wallet.address
      };

      const newQuote = await swapService.getSwapQuote(swapParams);
      
      if (newQuote) {
        setQuote(newQuote);
        setToAmount(newQuote.toAmount);
      } else {
        setQuoteError('No liquidity available for this pair');
        setToAmount('');
      }
    } catch (error) {
      console.error('Quote failed:', error);
      setQuoteError(error instanceof Error ? error.message : 'Failed to get quote');
      setToAmount('');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleTokenSwap = () => {
    const tempFromToken = tokens.fromToken;
    const tempFromAmount = fromAmount;
    
    setTokens({
      fromToken: tokens.toToken,
      toToken: tempFromToken
    });
    
    setFromAmount(toAmount);
    setToAmount(tempFromAmount);
  };

  const handleSwap = async () => {
    if (!quote || !wallet) return;
    setStep('password');
  };

  const handleConfirmSwap = async () => {
    if (!quote || !password || !wallet) return;
    
    setStep('swapping');
    setError('');
    
    try {
      // Validate password
      const account = walletManager.getStoredAccounts().find(acc => acc.address === wallet.address);
      if (!account) {
        throw new Error('Account not found');
      }
      
      const privateKey = await walletManager.getPrivateKeyForSigning(account.id, password);
      walletService.setCurrentAccount(privateKey);
      
      // Execute the swap
      const result = await swapService.executeSwap(quote, wallet.address);
      
      if (result.success && result.hash) {
        setTxHash(result.hash);
        setStep('success');
        
        // Refresh balances
        await Promise.all([refreshBalance(), refreshTokenBalances()]);
        
        toast.success('Swap completed successfully!');
      } else {
        throw new Error(result.error || 'Swap failed');
      }
      
    } catch (err) {
      console.error('Swap failed:', err);
      setError(err instanceof Error ? err.message : 'Swap failed');
      setStep('error');
      toast.error('Swap failed');
    } finally {
      walletService.clearCurrentAccount();
    }
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  const getExplorerUrl = (hash: string) => {
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io/tx/',
      137: 'https://polygonscan.com/tx/',
      56: 'https://bscscan.com/tx/',
    };
    
    return explorers[wallet?.chainId || 1] + hash;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="w-full max-w-md md:max-w-lg"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-background border shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <RefreshCw className="w-5 h-5 md:w-6 md:h-6" />
                  代币交换
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 md:space-y-6">
                {step === 'form' && (
                  <motion.div
                    className="space-y-4 md:space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {/* Settings Panel */}
                    <AnimatePresence>
                      {showSettings && (
                        <motion.div
                          className="p-4 bg-muted/50 rounded-lg space-y-3"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div>
                            <Label className="text-sm">滑点容忍度: {slippage}%</Label>
                            <Slider
                              value={[slippage]}
                              onValueChange={(value) => setSlippage(value[0])}
                              max={5}
                              min={0.1}
                              step={0.1}
                              className="mt-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>0.1%</span>
                              <span>5%</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* From Token */}
                    <div className="space-y-2">
                      <Label className="text-sm md:text-base">发送</Label>
                      <div className="relative">
                        <Card className="p-4">
                          <div className="flex justify-between items-center gap-4">
                            <div className="flex-1">
                              <Input
                                type="number"
                                placeholder="0.0"
                                value={fromAmount}
                                onChange={(e) => setFromAmount(e.target.value)}
                                className="border-0 p-0 text-lg font-semibold bg-transparent focus-visible:ring-0"
                              />
                            </div>
                            <Select
                              value={tokens.fromToken?.address || ''}
                              onValueChange={(value) => {
                                const token = availableTokens.find(t => t.address === value);
                                setTokens(prev => ({ ...prev, fromToken: token || null }));
                              }}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="选择代币" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTokens.map((token) => (
                                  <SelectItem key={token.address} value={token.address}>
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-bold">{token.symbol[0]}</span>
                                      </div>
                                      <span>{token.symbol}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </Card>
                      </div>
                    </div>

                    {/* Swap Direction Button */}
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleTokenSwap}
                        className="rounded-full"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* To Token */}
                    <div className="space-y-2">
                      <Label className="text-sm md:text-base">接收</Label>
                      <Card className="p-4">
                        <div className="flex justify-between items-center gap-4">
                          <div className="flex-1">
                            <Input
                              type="number"
                              placeholder="0.0"
                              value={toAmount}
                              readOnly
                              className="border-0 p-0 text-lg font-semibold bg-transparent focus-visible:ring-0"
                            />
                            {isLoadingQuote && (
                              <div className="flex items-center gap-2 mt-1">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span className="text-xs text-muted-foreground">获取报价中...</span>
                              </div>
                            )}
                          </div>
                          <Select
                            value={tokens.toToken?.address || ''}
                            onValueChange={(value) => {
                              const token = availableTokens.find(t => t.address === value);
                              setTokens(prev => ({ ...prev, toToken: token || null }));
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="选择代币" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTokens.map((token) => (
                                <SelectItem key={token.address} value={token.address}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-bold">{token.symbol[0]}</span>
                                    </div>
                                    <span>{token.symbol}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </Card>
                    </div>

                    {/* Quote Information */}
                    {quote && (
                      <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">交易详情</span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>预期获得:</span>
                            <span className="font-medium">{quote.toAmount} {tokens.toToken?.symbol}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>最少获得:</span>
                            <span className="font-medium">{quote.toAmountMin} {tokens.toToken?.symbol}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>价格影响:</span>
                            <span className={cn(
                              "font-medium flex items-center gap-1",
                              quote.priceImpact > 3 ? "text-destructive" : "text-green-600"
                            )}>
                              {quote.priceImpact > 3 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                              {quote.priceImpact.toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>交易费用:</span>
                            <span className="font-medium">{quote.fee}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>网络费用:</span>
                            <span className="font-medium">~{quote.gas} Gas</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>报价有效期: {quote.validFor}秒</span>
                        </div>
                      </div>
                    )}

                    {/* Error Display */}
                    {quoteError && (
                      <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{quoteError}</span>
                      </div>
                    )}

                    {/* Swap Button */}
                    <Button
                      onClick={handleSwap}
                      disabled={!quote || isLoadingQuote || !!quoteError}
                      className="w-full h-11 md:h-12 text-sm md:text-base"
                    >
                      {isLoadingQuote ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          获取报价中...
                        </>
                      ) : quote ? (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          确认交换
                        </>
                      ) : (
                        '请输入交换金额'
                      )}
                    </Button>
                  </motion.div>
                )}

                {/* Password Confirmation Step */}
                {step === 'password' && quote && (
                  <motion.div
                    className="space-y-4 md:space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="text-center">
                      <h3 className="text-lg md:text-xl font-semibold mb-2">确认交换</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        输入钱包密码以签署交易
                      </p>
                    </div>

                    {/* Swap Summary */}
                    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm md:text-base">发送:</span>
                        <span className="font-medium text-sm md:text-base">
                          {quote.fromAmount} {tokens.fromToken?.symbol}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm md:text-base">接收:</span>
                        <span className="font-medium text-sm md:text-base">
                          {quote.toAmount} {tokens.toToken?.symbol}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm md:text-base">协议:</span>
                        <span className="text-sm md:text-base">{quote.provider}</span>
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm md:text-base">
                        钱包密码
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="输入钱包密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 md:h-12 text-sm md:text-base"
                        onKeyDown={(e) => e.key === 'Enter' && password && handleConfirmSwap()}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep('form')}
                        className="flex-1 h-11 md:h-12 text-sm md:text-base"
                      >
                        返回
                      </Button>
                      <Button
                        onClick={handleConfirmSwap}
                        disabled={!password}
                        className="flex-1 h-11 md:h-12 text-sm md:text-base"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        确认交换
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Swapping State */}
                {step === 'swapping' && (
                  <motion.div
                    className="text-center space-y-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 md:w-10 md:h-10 animate-spin text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold mb-2">正在交换代币</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        请等待交易在区块链上确认...
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Success State */}
                {step === 'success' && (
                  <motion.div
                    className="text-center space-y-4 md:space-y-6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold mb-2">交换成功！</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        您的代币交换已成功提交到网络。
                      </p>
                    </div>

                    {txHash && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">交易哈希:</span>
                          <div className="flex items-center gap-1">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {formatAddress(txHash)}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => navigator.clipboard.writeText(txHash)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => window.open(getExplorerUrl(txHash), '_blank')}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleClose}
                      className="w-full h-11 md:h-12 text-sm md:text-base"
                    >
                      完成
                    </Button>
                  </motion.div>
                )}

                {/* Error State */}
                {step === 'error' && (
                  <motion.div
                    className="text-center space-y-4 md:space-y-6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-destructive rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold mb-2">交换失败</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        {error || '处理交换时发生错误。'}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep('form')}
                        className="flex-1 h-11 md:h-12 text-sm md:text-base"
                      >
                        重试
                      </Button>
                      <Button
                        onClick={handleClose}
                        className="flex-1 h-11 md:h-12 text-sm md:text-base"
                      >
                        关闭
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}