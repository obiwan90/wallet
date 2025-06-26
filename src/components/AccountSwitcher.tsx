"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Plus,
  Check,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useWeb3 } from '@/contexts/Web3Context';
import { walletManager, type WalletData } from '@/lib/wallet-manager';
import { walletService, type Account, formatAddress } from '@/lib/web3';
import { toast } from 'sonner';

interface AccountSwitcherProps {
  className?: string;
}

export function AccountSwitcher({ className }: AccountSwitcherProps) {
  const { wallet, setWallet, currentUserSession, setCurrentUserSession } = useWeb3();
  const [isOpen, setIsOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState<string>('');
  const [isGeneratingAccount, setIsGeneratingAccount] = useState(false);

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  // Reload accounts when wallet changes
  useEffect(() => {
    if (wallet) {
      loadAccounts();
    }
  }, [wallet?.address]);

  const loadAccounts = () => {
    const storedAccounts = walletManager.getStoredAccounts();
    setAccounts(storedAccounts);

    // Find current account
    if (wallet && storedAccounts.length > 0) {
      const current = storedAccounts.find(acc => acc.address === wallet.address);
      if (current) {
        setCurrentAccountId(current.id);
      } else if (storedAccounts.length > 0) {
        // If no current account found, set the first one as current
        setCurrentAccountId(storedAccounts[0].id);
      }
    }
  };

  const getCurrentAccount = () => {
    return accounts.find(acc => acc.id === currentAccountId);
  };

  const handleAccountSwitch = async (account: Account, password?: string) => {
    try {
      // If no password provided, show password prompt (simplified for this demo)
      if (!password) {
        const userPassword = prompt('Enter wallet password to switch account:');
        if (!userPassword) return;
        password = userPassword;
      }

      // Validate password
      const isValid = await walletManager.validateWalletPassword(account.id, password);
      if (!isValid) {
        toast.error('Incorrect password');
        return;
      }

      // Switch to the account
      setWallet({
        address: account.address,
        balance: '0.0',
        chainId: wallet?.chainId || 1,
        chain: walletService.getCurrentChain()
      });

      // Update session info for the new current account
      setCurrentUserSession({
        accountId: account.id,
        password: password
      });

      walletService.switchAccount(account.id);
      setCurrentAccountId(account.id);
      setIsOpen(false);
      toast.success(`Switched to ${account.name}`);
    } catch (error) {
      console.error('Account switch failed:', error);
      toast.error('Failed to switch account');
    }
  };

  const handleGenerateNewAccount = async () => {
    console.log('=== Starting account generation ===');
    console.log('currentAccountId:', currentAccountId);
    console.log('currentUserSession:', currentUserSession);
    console.log('accounts.length:', accounts.length);

    // Debug: Print all account IDs
    console.log('All accounts:', accounts.map(acc => ({ id: acc.id, address: acc.address, name: acc.name })));

    // Debug: Print stored accounts from manager
    const storedAccounts = walletManager.getStoredAccounts();
    console.log('Stored accounts from manager:', storedAccounts.map(acc => ({ id: acc.id, address: acc.address, name: acc.name })));

    if (!currentAccountId) {
      toast.error('No base account found');
      return;
    }

    // Check if we have cached session info
    if (!currentUserSession) {
      console.log('No currentUserSession found');
      toast.error('Please re-login to create new accounts');
      return;
    }

    setIsGeneratingAccount(true);
    try {
      // Generate next account index
      const accountIndex = accounts.length;
      console.log('Generated accountIndex:', accountIndex);

      // Get the current account to access the mnemonic
      const currentAccount = accounts.find(acc => acc.id === currentAccountId);
      console.log('Found currentAccount:', currentAccount);
      if (!currentAccount) {
        toast.error('Current account not found');
        return;
      }

      // Use cached password from session
      const password = currentUserSession.password;
      console.log('Using password from session (length):', password?.length);

      // Use the session account ID for decryption (this should match the stored account)
      const sessionAccountId = currentUserSession.accountId;
      console.log('Using session account ID for decryption:', sessionAccountId);

      // Debug: Check if session account ID exists in stored accounts
      const sessionAccountExists = storedAccounts.find(acc => acc.id === sessionAccountId);
      console.log('Session account exists in storage:', !!sessionAccountExists);
      if (sessionAccountExists) {
        console.log('Session account details:', { id: sessionAccountExists.id, address: sessionAccountExists.address });
      }

      // Get the current account's wallet data to access mnemonic
      console.log('Attempting to decrypt wallet data...');
      const currentWalletData = await walletManager.decryptStoredWallet(sessionAccountId, password);
      console.log('Decrypted wallet data:', {
        hasMnemonic: !!currentWalletData.mnemonic,
        address: currentWalletData.address,
        name: currentWalletData.name
      });

      if (!currentWalletData.mnemonic) {
        toast.error('Cannot generate new account: No mnemonic found');
        return;
      }

      // Generate new account from the same mnemonic
      console.log('Generating new account from mnemonic...');
      const newWalletData = walletManager.generateAccountFromMnemonic(
        currentWalletData.mnemonic,
        accountIndex
      );
      console.log('Generated new wallet data:', {
        address: newWalletData.address,
        name: newWalletData.name
      });

      // Save the new account with the same password
      console.log('Saving new account to storage...');
      await walletManager.saveWalletToStorage(newWalletData, password);
      console.log('Account saved successfully');

      // Reload accounts
      loadAccounts();

      // Automatically switch to the new account
      setTimeout(() => {
        const updatedAccounts = walletManager.getStoredAccounts();
        console.log('Updated accounts after reload:', updatedAccounts.length);
        const newAccount = updatedAccounts.find(acc => acc.address === newWalletData.address);
        console.log('Found new account in storage:', !!newAccount);
        if (newAccount) {
          // Switch without prompting for password again since we just used it
          setWallet({
            address: newAccount.address,
            balance: '0.0',
            chainId: wallet?.chainId || 1,
            chain: walletService.getCurrentChain()
          });

          // Update session info for the new account
          setCurrentUserSession({
            accountId: newAccount.id,
            password: password
          });

          walletService.switchAccount(newAccount.id);
          setCurrentAccountId(newAccount.id);
          setIsOpen(false);
          toast.success(`Created and switched to ${newAccount.name}`);
        } else {
          console.error('New account not found in storage after creation');
          toast.error('Account created but could not switch to it');
        }
      }, 100);

    } catch (error) {
      console.error('Failed to generate new account:', error);
      toast.error(`Failed to generate new account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingAccount(false);
    }
  };

  const handleCopyAddress = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  const currentAccount = getCurrentAccount();

  if (!wallet || accounts.length === 0) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 h-auto p-3 bg-muted/50 hover:bg-muted rounded-lg"
      >
        <div className="text-left">
          <div className="text-sm font-medium">{currentAccount?.name || 'Account'}</div>
          <div className="text-xs text-muted-foreground">
            {formatAddress(wallet.address)}
          </div>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform text-muted-foreground",
          isOpen && "rotate-180"
        )} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              className="absolute top-full left-0 mt-2 w-80 z-50"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="shadow-2xl border border-border/50">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">账户列表</h3>
                      <Badge variant="secondary" className="text-xs">
                        {accounts.length} 个账户
                      </Badge>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {accounts.map((account, index) => (
                        <motion.div
                          key={account.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border border-transparent cursor-pointer transition-all",
                            account.id === currentAccountId
                              ? "bg-primary/10 border-primary/20"
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => account.id !== currentAccountId && handleAccountSwitch(account)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {account.name}
                              </span>
                              {account.id === currentAccountId && (
                                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatAddress(account.address)}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-60 hover:opacity-100 ml-2"
                            onClick={(e) => handleCopyAddress(account.address, e)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="p-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-sm"
                      onClick={handleGenerateNewAccount}
                      disabled={isGeneratingAccount}
                    >
                      <Plus className="w-4 h-4" />
                      {isGeneratingAccount ? '创建中...' : '创建新账户'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}