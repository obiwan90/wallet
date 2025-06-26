"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  X,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  ArrowRight,
  Loader2,
  Wallet as WalletIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useWeb3 } from '@/contexts/Web3Context';
import { walletService, isValidAddress, formatAddress, NETWORKS, type TransactionRequest, type TokenTransferRequest } from '@/lib/web3';
import { walletManager } from '@/lib/wallet-manager';
import { toast } from 'sonner';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAsset?: {
    symbol: string;
    name: string;
    address?: string;
    decimals?: number;
    balance: string;
    isNative?: boolean;
  };
}

export function SendModal({ isOpen, onClose, selectedAsset }: SendModalProps) {
  const { wallet, refreshBalance, refreshTokenBalances } = useWeb3();
  
  // Form states
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [memo, setMemo] = useState('');
  
  // UI states
  const [step, setStep] = useState<'form' | 'confirm' | 'password' | 'sending' | 'success' | 'error'>('form');
  const [isValidRecipient, setIsValidRecipient] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<any>(null);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);

  const networkConfig = wallet ? NETWORKS[wallet.chainId as keyof typeof NETWORKS] : null;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setRecipient('');
      setAmount('');
      setPassword('');
      setMemo('');
      setError('');
      setTxHash('');
      setGasEstimate(null);
    }
  }, [isOpen]);

  // Validate recipient address
  useEffect(() => {
    setIsValidRecipient(recipient.length > 0 && isValidAddress(recipient));
  }, [recipient]);

  // Estimate gas when form is complete
  useEffect(() => {
    if (isValidRecipient && amount && parseFloat(amount) > 0 && wallet) {
      estimateGas();
    }
  }, [recipient, amount, selectedAsset, wallet]);

  const estimateGas = async () => {
    if (!wallet || !selectedAsset) return;
    
    setIsEstimatingGas(true);
    setError('');
    
    try {
      let estimate;
      
      if (selectedAsset.isNative) {
        // Native token transfer
        const request: TransactionRequest = {
          to: recipient as `0x${string}`,
          value: amount
        };
        estimate = await walletService.estimateGas(request);
      } else {
        // ERC-20 token transfer - simplified estimation
        estimate = {
          gasLimit: BigInt(100000),
          gasPrice: BigInt(20000000000), // 20 gwei
          estimatedCost: '0.002'
        };
      }
      
      setGasEstimate(estimate);
    } catch (err) {
      console.error('Gas estimation failed:', err);
      setError('Failed to estimate transaction fee');
    } finally {
      setIsEstimatingGas(false);
    }
  };

  const handleSend = async () => {
    if (!wallet || !selectedAsset || !gasEstimate) return;
    
    setStep('password');
  };

  const handleConfirmSend = async () => {
    if (!wallet || !selectedAsset || !password) return;
    
    setStep('sending');
    setError('');
    
    try {
      // Get current account ID from localStorage (simplified)
      const accounts = walletManager.getStoredAccounts();
      const currentAccountId = accounts[0]?.id; // Use first account for demo
      
      if (!currentAccountId) {
        throw new Error('No account found');
      }

      // Validate password and get private key
      const privateKey = await walletManager.getPrivateKeyForSigning(currentAccountId, password);
      
      // Set the account for transaction signing
      walletService.setCurrentAccount(privateKey);
      
      let result;
      
      if (selectedAsset.isNative) {
        // Send native token
        const request: TransactionRequest = {
          to: recipient as `0x${string}`,
          value: amount,
          gasLimit: gasEstimate.gasLimit,
          gasPrice: gasEstimate.gasPrice,
          maxFeePerGas: gasEstimate.maxFeePerGas,
          maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas
        };
        
        result = await walletService.sendTransaction(request);
      } else {
        // Send ERC-20 token
        const request: TokenTransferRequest = {
          tokenAddress: selectedAsset.address as `0x${string}`,
          to: recipient as `0x${string}`,
          amount: amount
        };
        
        result = await walletService.sendTokenTransfer(request);
      }
      
      if (result.success) {
        setTxHash(result.hash);
        setStep('success');
        
        // Refresh balances
        await Promise.all([refreshBalance(), refreshTokenBalances()]);
        
        toast.success('Transaction sent successfully!');
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
      
    } catch (err) {
      console.error('Transaction failed:', err);
      setError(err instanceof Error ? err.message : 'Transaction failed');
      setStep('error');
      toast.error('Transaction failed');
    } finally {
      // Clear the account for security
      walletService.clearCurrentAccount();
    }
  };

  const handleClose = () => {
    setPassword(''); // Clear sensitive data
    onClose();
  };

  const getAvailableBalance = () => {
    if (!selectedAsset) return '0';
    return selectedAsset.balance;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };

  const getExplorerUrl = (hash: string) => {
    if (!networkConfig) return '#';
    
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io/tx/',
      137: 'https://polygonscan.com/tx/',
      56: 'https://bscscan.com/tx/',
      43114: 'https://snowtrace.io/tx/',
      42161: 'https://arbiscan.io/tx/',
      10: 'https://optimistic.etherscan.io/tx/',
      8453: 'https://basescan.org/tx/'
    };
    
    return explorers[wallet?.chainId || 1] + hash;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="w-full max-w-md md:max-w-lg lg:max-w-xl"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="bg-background border shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Send className="w-5 h-5 md:w-6 md:h-6" />
                Send {selectedAsset?.symbol || 'Asset'}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-4 md:space-y-6">
              {step === 'form' && (
                <motion.div
                  className="space-y-4 md:space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Asset Info */}
                  {selectedAsset && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                        <span className="font-bold text-sm md:text-base">
                          {selectedAsset.symbol[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm md:text-base">{selectedAsset.symbol}</div>
                        <div className="text-xs md:text-sm text-muted-foreground">
                          Balance: {getAvailableBalance()}
                        </div>
                      </div>
                      {networkConfig && (
                        <Badge variant="secondary" className="text-xs">
                          {networkConfig.name}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Recipient */}
                  <div className="space-y-2">
                    <Label htmlFor="recipient" className="text-sm md:text-base">
                      Recipient Address
                    </Label>
                    <Input
                      id="recipient"
                      placeholder="0x..."
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className={cn(
                        "h-11 md:h-12 text-sm md:text-base",
                        recipient && !isValidRecipient && "border-destructive"
                      )}
                    />
                    {recipient && !isValidRecipient && (
                      <div className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="w-3 h-3" />
                        Invalid Ethereum address
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm md:text-base">
                      Amount
                    </Label>
                    <div className="relative">
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-11 md:h-12 text-sm md:text-base pr-16"
                        step="any"
                        min="0"
                        max={getAvailableBalance()}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2 text-xs"
                        onClick={() => setAmount(getAvailableBalance())}
                      >
                        MAX
                      </Button>
                    </div>
                  </div>

                  {/* Gas Estimate */}
                  {gasEstimate && (
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Network Fee:</span>
                        <span className="font-medium">
                          {gasEstimate.estimatedCost} {networkConfig?.symbol}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Cost:</span>
                        <span className="font-medium">
                          {(parseFloat(amount || '0') + parseFloat(gasEstimate.estimatedCost)).toFixed(6)} {selectedAsset?.symbol}
                        </span>
                      </div>
                    </div>
                  )}

                  {isEstimatingGas && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Estimating network fee...
                    </div>
                  )}

                  {/* Send Button */}
                  <Button
                    onClick={handleSend}
                    disabled={!isValidRecipient || !amount || parseFloat(amount) <= 0 || !gasEstimate || isEstimatingGas}
                    className="w-full h-11 md:h-12 text-sm md:text-base"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Review Transaction
                  </Button>
                </motion.div>
              )}

              {step === 'password' && (
                <motion.div
                  className="space-y-4 md:space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="text-center">
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Confirm Transaction</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Enter your wallet password to sign the transaction
                    </p>
                  </div>

                  {/* Transaction Summary */}
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm md:text-base">Sending:</span>
                      <span className="font-medium text-sm md:text-base">{amount} {selectedAsset?.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm md:text-base">To:</span>
                      <span className="font-mono text-sm">{formatAddress(recipient)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm md:text-base">Network Fee:</span>
                      <span className="text-sm md:text-base">{gasEstimate?.estimatedCost} {networkConfig?.symbol}</span>
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm md:text-base">
                      Wallet Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your wallet password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 md:h-12 text-sm md:text-base"
                      onKeyDown={(e) => e.key === 'Enter' && password && handleConfirmSend()}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep('form')}
                      className="flex-1 h-11 md:h-12 text-sm md:text-base"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleConfirmSend}
                      disabled={!password}
                      className="flex-1 h-11 md:h-12 text-sm md:text-base"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'sending' && (
                <motion.div
                  className="text-center space-y-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Sending Transaction</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Please wait while your transaction is being processed...
                    </p>
                  </div>
                </motion.div>
              )}

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
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Transaction Sent!</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Your transaction has been successfully submitted to the network.
                    </p>
                  </div>

                  {txHash && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">Transaction Hash:</span>
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
                    Done
                  </Button>
                </motion.div>
              )}

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
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Transaction Failed</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      {error || 'An error occurred while processing your transaction.'}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep('form')}
                      className="flex-1 h-11 md:h-12 text-sm md:text-base"
                    >
                      Try Again
                    </Button>
                    <Button
                      onClick={handleClose}
                      className="flex-1 h-11 md:h-12 text-sm md:text-base"
                    >
                      Close
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}