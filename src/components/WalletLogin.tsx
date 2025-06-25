"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Wallet, Download, Plus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { walletManager, type WalletData } from '@/lib/wallet-manager';
import { walletService, type Account } from '@/lib/web3';
import { useWeb3 } from '@/contexts/Web3Context';
import { toast } from 'sonner';
import { gsap } from 'gsap';
import { useTheme } from 'next-themes';
import { ThemeToggle } from '@/components/theme-toggle';
import { NetworkSelector } from '@/components/network-selector';


interface WalletLoginProps {
  onWalletConnected: () => void;
}

export function WalletLogin({ onWalletConnected }: WalletLoginProps) {
  const { setWallet } = useWeb3();
  const [hasWallet, setHasWallet] = React.useState<boolean | null>(null);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [showImportWallet, setShowImportWallet] = React.useState(false);
  const [isImportWalletMode, setIsImportWalletMode] = React.useState(false);
  const [showSeedPhrase, setShowSeedPhrase] = React.useState(false);
  const [generatedWallet, setGeneratedWallet] = React.useState<WalletData | null>(null);
  const [seedPhrase, setSeedPhrase] = React.useState("");
  const [seedWords, setSeedWords] = React.useState<string[]>(Array(12).fill(""));
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [confirmPhrase, setConfirmPhrase] = React.useState("");
  const [walletName, setWalletName] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // GSAP refs for animations
  const loginFormRef = React.useRef<HTMLDivElement>(null);
  const forgotPasswordFormRef = React.useRef<HTMLDivElement>(null);
  const createWalletFormRef = React.useRef<HTMLDivElement>(null);
  const importWalletFormRef = React.useRef<HTMLDivElement>(null);
  const seedPhraseConfirmRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    // Check for existing wallets
    const accounts = walletManager.getStoredAccounts();
    setHasWallet(accounts.length > 0);
  }, []);

  // Initial entrance animation
  React.useEffect(() => {
    if (cardRef.current && hasWallet !== null) {
      gsap.fromTo(cardRef.current,
        {
          opacity: 0,
          y: 50,
          scale: 0.9
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power2.out"
        }
      );
    }
  }, [hasWallet]);

  // GSAP Typewriter Effect for Magic Wallet Title
  React.useEffect(() => {
    if (titleRef.current) {
      const text = "Magic Wallet";
      const titleElement = titleRef.current;

      // Clear the text initially
      titleElement.textContent = "";

      // Create the typewriter effect
      const tl = gsap.timeline({ delay: 0.5 });

      // Add each character with a slight delay
      text.split("").forEach((char, index) => {
        tl.to({}, {
          duration: 0.1,
          onComplete: () => {
            titleElement.textContent += char;
          }
        });
      });

      // Add a blinking cursor effect
      tl.set(titleElement, {
        borderRight: "2px solid white",
        paddingRight: "2px"
      })
        .to(titleElement, {
          borderRightColor: "transparent",
          duration: 0.5,
          repeat: 3,
          yoyo: true
        })
        .set(titleElement, {
          borderRight: "none",
          paddingRight: "0"
        });
    }
  }, []);

  // Enhanced GSAP Animation Functions with rolling effects
  const animateCardTransition = (
    outElement: HTMLElement | null,
    inElement: HTMLElement | null,
    direction: 'toForgotPassword' | 'toLogin' | 'toImport'
  ) => {
    const tl = gsap.timeline();

    if (outElement) {
      // Enhanced exit animation with rotation and scaling
      const exitY = direction === 'toForgotPassword' ? -150 : direction === 'toImport' ? 150 : 100;
      const exitRotation = direction === 'toForgotPassword' ? -5 : direction === 'toImport' ? 5 : 3;

      tl.to(outElement, {
        opacity: 0,
        y: exitY,
        x: direction === 'toImport' ? -30 : 0,
        scale: 0.8,
        rotation: exitRotation,
        duration: 0.6,
        ease: "power2.in",
        transformOrigin: "center center"
      });
    }

    if (inElement) {
      // Enhanced entry animation with rolling and bouncing effect
      const startY = direction === 'toForgotPassword' ? 150 : direction === 'toImport' ? -150 : -100;
      const startRotation = direction === 'toForgotPassword' ? 5 : direction === 'toImport' ? -5 : -3;

      tl.fromTo(inElement,
        {
          opacity: 0,
          y: startY,
          x: direction === 'toImport' ? 30 : 0,
          scale: 0.8,
          rotation: startRotation
        },
        {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          rotation: 0,
          duration: 0.8,
          ease: "elastic.out(1, 0.7)",
          transformOrigin: "center center"
        },
        outElement ? 0.2 : 0
      );
    }

    return tl;
  };

  const animateButtonClick = (button: HTMLElement) => {
    const tl = gsap.timeline();

    tl.to(button, {
      scale: 0.92,
      rotation: 1,
      duration: 0.1,
      ease: "power2.out"
    })
      .to(button, {
        scale: 1.02,
        rotation: -0.5,
        duration: 0.15,
        ease: "elastic.out(1, 0.5)"
      })
      .to(button, {
        scale: 1,
        rotation: 0,
        duration: 0.1,
        ease: "power2.out"
      });
  };

  // Enhanced forgot password toggle with GSAP for independent cards
  const handleForgotPasswordToggle = (show: boolean) => {
    if (show) {
      // Forgot password card slides up from bottom, login card slides up and out
      animateCardTransition(loginFormRef.current, forgotPasswordFormRef.current, 'toForgotPassword');
    } else {
      // Login card slides down from top, forgot password card slides down and out
      animateCardTransition(forgotPasswordFormRef.current, loginFormRef.current, 'toLogin');
    }
    setShowForgotPassword(show);
  };

  // Handle seed word updates for import wallet
  const handleSeedWordChange = (index: number, value: string) => {
    const newSeedWords = [...seedWords];
    newSeedWords[index] = value;
    setSeedWords(newSeedWords);
    setSeedPhrase(newSeedWords.join(' ').trim());
  };

  // Enhanced create/import wallet toggle
  const handleWalletModeToggle = (showImport: boolean) => {
    if (showImport) {
      // Import form slides up from bottom, create form slides up and out
      animateCardTransition(createWalletFormRef.current, importWalletFormRef.current, 'toImport');
    } else {
      // Create form slides down from top, import form slides down and out
      animateCardTransition(importWalletFormRef.current, createWalletFormRef.current, 'toLogin');
    }
    setIsImportWalletMode(showImport);
  };

  const handleLogin = async () => {
    if (!password) {
      toast.error('Please enter password');
      return;
    }

    setIsLoading(true);
    try {
      const accounts = walletManager.getStoredAccounts();
      if (accounts.length === 0) {
        toast.error('No wallet accounts found');
        return;
      }

      const account = accounts[0];

      setWallet({
        address: account.address,
        balance: '0.0',
        chainId: 1,
        chain: walletService.getCurrentChain()
      });

      walletService.switchAccount(account.id);
      toast.success('Welcome back!');
      onWalletConnected();
    } catch (error) {
      toast.error('Incorrect password or failed to unlock wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWallet = async () => {
    if (!seedPhrase.trim()) {
      toast.error('Please enter seed phrase');
      return;
    }
    if (!password) {
      toast.error('Please set a password');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const wallet = walletManager.importFromMnemonic(
        seedPhrase.trim(),
        walletName || 'Imported Wallet'
      );

      walletManager.saveWalletToStorage(wallet, password);

      const account: Account = {
        id: Date.now().toString(),
        name: wallet.name,
        address: wallet.address,
        type: 'imported'
      };

      walletService.addAccount(account);

      setWallet({
        address: wallet.address,
        balance: '0.0',
        chainId: 1,
        chain: walletService.getCurrentChain()
      });

      if (hasWallet) {
        toast.success('Wallet imported successfully! Switched to imported wallet');
      } else {
        toast.success('Wallet imported successfully!');
      }
      onWalletConnected();
    } catch (error) {
      toast.error('Invalid seed phrase');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    if (!password) {
      toast.error('Please set a password');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const wallet = walletManager.generateWallet();
      wallet.name = walletName || (hasWallet ? 'New Wallet' : 'My Wallet');

      // Store the generated wallet temporarily and show seed phrase
      setGeneratedWallet(wallet);
      setShowSeedPhrase(true);

      // Animate to seed phrase confirmation screen
      animateCardTransition(createWalletFormRef.current, seedPhraseConfirmRef.current, 'toForgotPassword');

      toast.success('Wallet generated! Please save your seed phrase.');
    } catch (error) {
      toast.error('Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSeedPhrase = async () => {
    if (!generatedWallet) return;

    setIsLoading(true);
    try {
      walletManager.saveWalletToStorage(generatedWallet, password);

      const account: Account = {
        id: Date.now().toString(),
        name: generatedWallet.name,
        address: generatedWallet.address,
        type: 'generated'
      };

      walletService.addAccount(account);

      setWallet({
        address: generatedWallet.address,
        balance: '0.0',
        chainId: 1,
        chain: walletService.getCurrentChain()
      });

      if (hasWallet) {
        toast.success('New wallet created successfully! Switched to new wallet');
      } else {
        toast.success('Wallet created successfully!');
      }
      onWalletConnected();

    } catch (error) {
      toast.error('Failed to save wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCreateWallet = () => {
    // Reset states and go back to create wallet form
    setShowSeedPhrase(false);
    setGeneratedWallet(null);
    setConfirmPhrase("");
    animateCardTransition(seedPhraseConfirmRef.current, createWalletFormRef.current, 'toLogin');
  };

  return (
    <div className="min-h-screen relative">
      {/* Corner Controls */}
      <div className="absolute top-4 left-4 z-20">
        <NetworkSelector />
      </div>
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="min-h-screen p-2 sm:p-4 overflow-y-auto">
        <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-center py-4">
          {/* Logo and Title */}
          <div className="text-center mb-6 md:mb-8">
            <h1 ref={titleRef} className="text-4xl md:text-6xl font-black text-foreground mb-4 tracking-wide" style={{ fontFamily: '"Creepster", "Chiller", "Papyrus", "Brush Script MT", cursive', textShadow: `2px 2px 4px hsl(var(--foreground) / 0.5)` }}>Magic Wallet</h1>
            <p className="text-muted-foreground text-sm md:text-base">Smart Web3 wallet, securely manage your digital assets</p>
          </div>

          {hasWallet === null ? (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardContent className="p-4 md:p-6">
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-gray-300 dark:border-white/20 border-t-gray-600 dark:border-t-white rounded-full mx-auto"></div>
                  <p className="text-gray-600 dark:text-white/70 mt-2">Checking wallet status...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Login Card */}
              {hasWallet && !showForgotPassword && (
                <Card ref={loginFormRef} className="bg-white/20 dark:bg-white/10 backdrop-blur-lg border-white/30 dark:border-white/20 shadow-2xl dark:shadow-white/5">
                  <CardContent className="p-4 md:p-6">
                    <div className="space-y-4 md:space-y-6 mt-4 md:mt-6">
                      <div className="text-center py-2 md:py-4">
                        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1 md:mb-2">Welcome Back</h3>
                        <p className="text-muted-foreground text-xs md:text-sm">
                          Enter your password to unlock your wallet
                        </p>
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="loginPassword" className="text-foreground text-sm">Wallet Password</Label>
                        <Input
                          id="loginPassword"
                          type="password"
                          placeholder="Enter your wallet password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-background/30 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 text-sm h-10 md:h-11"
                          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                      </div>

                      <Button
                        onClick={(e) => {
                          animateButtonClick(e.currentTarget);
                          setTimeout(() => handleLogin(), 100);
                        }}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-2 md:py-3 text-sm md:text-base mt-4"
                      >
                        {isLoading ? "Unlocking..." : "Unlock Wallet"}
                      </Button>

                      <div className="text-center">
                        <button
                          onClick={(e) => {
                            animateButtonClick(e.currentTarget);
                            setTimeout(() => handleForgotPasswordToggle(true), 100);
                          }}
                          className="text-muted-foreground hover:text-foreground text-xs underline transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Forgot Password Card */}
              {hasWallet && showForgotPassword && (
                <Card ref={forgotPasswordFormRef} className="bg-white/20 dark:bg-white/10 backdrop-blur-lg border-white/30 dark:border-white/20 shadow-2xl dark:shadow-white/5">
                  <CardContent className="p-4 md:p-6">
                    <div className="space-y-3 md:space-y-4 mt-4 md:mt-6">
                      <div className="text-center py-2 md:py-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                          <Download className="w-6 h-6 md:w-8 md:h-8 text-white" />
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1 md:mb-2">Forgot Password?</h3>
                        <p className="text-muted-foreground text-xs md:text-sm mb-2 md:mb-4">
                          Use your seed phrase to recover your wallet
                        </p>
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="seedPhrase" className="text-foreground text-sm">Seed Phrase</Label>
                        <Textarea
                          id="seedPhrase"
                          placeholder="Enter your 12 or 24 word seed phrase, separated by spaces"
                          value={seedPhrase}
                          onChange={(e) => setSeedPhrase(e.target.value)}
                          className="bg-background/30 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 text-sm"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="walletName" className="text-foreground text-sm">Wallet Name</Label>
                        <Input
                          id="walletName"
                          placeholder="Give your wallet a name"
                          value={walletName}
                          onChange={(e) => setWalletName(e.target.value)}
                          className="bg-background/30 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 text-sm h-9"
                        />
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="password" className="text-foreground text-sm">New Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Set new wallet password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-background/30 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 text-sm h-9"
                        />
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="confirmPassword" className="text-foreground text-sm">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Enter password again"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-background/30 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 text-sm h-9"
                        />
                      </div>

                      <Button
                        onClick={(e) => {
                          animateButtonClick(e.currentTarget);
                          setTimeout(() => handleImportWallet(), 100);
                        }}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-2 md:py-3 text-sm md:text-base mt-4"
                      >
                        {isLoading ? "Recovering..." : "Recover Wallet"}
                      </Button>

                      <div className="text-center">
                        <button
                          onClick={(e) => {
                            animateButtonClick(e.currentTarget);
                            setTimeout(() => handleForgotPasswordToggle(false), 100);
                          }}
                          className="text-muted-foreground hover:text-foreground text-xs underline transition-colors"
                        >
                          Back to Login
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Create Wallet Card */}
              {!hasWallet && !showSeedPhrase && !isImportWalletMode && (
                <Card ref={createWalletFormRef} className="bg-white/20 dark:bg-white/10 backdrop-blur-lg border-white/30 dark:border-white/20 shadow-2xl dark:shadow-white/5">
                  <CardContent className="p-4 md:p-6">
                    <div className="space-y-3 md:space-y-4 mt-4 md:mt-6">
                      <div className="text-center py-2 md:py-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                          <Plus className="w-6 h-6 md:w-8 md:h-8 text-white" />
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1 md:mb-2">Create New Wallet</h3>
                        <p className="text-muted-foreground text-xs md:text-sm mb-2 md:mb-4">
                          We'll generate a secure wallet and seed phrase for you
                        </p>
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="newWalletName" className="text-foreground text-sm">Wallet Name</Label>
                        <Input
                          id="newWalletName"
                          placeholder="Give your wallet a name"
                          value={walletName}
                          onChange={(e) => setWalletName(e.target.value)}
                          className="bg-background/30 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 text-sm h-9"
                        />
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="newPassword" className="text-foreground text-sm">Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="Set wallet password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-background/30 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 text-sm h-9"
                        />
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="newConfirmPassword" className="text-foreground text-sm">Confirm Password</Label>
                        <Input
                          id="newConfirmPassword"
                          type="password"
                          placeholder="Enter password again"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-background/30 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 text-sm h-9"
                        />
                      </div>

                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2 md:p-4">
                        <p className="text-destructive-foreground text-xs md:text-sm">
                          <strong>Important:</strong> Please save your seed phrase in a secure place. You'll need it to recover your wallet.
                        </p>
                      </div>

                      <Button
                        onClick={(e) => {
                          animateButtonClick(e.currentTarget);
                          setTimeout(() => handleCreateWallet(), 100);
                        }}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 text-white font-semibold py-2 md:py-3 text-sm md:text-base mt-4"
                      >
                        {isLoading ? "Creating..." : "Create Wallet"}
                      </Button>

                      <div className="text-center">
                        <p className="text-muted-foreground text-xs mb-2">Already have a wallet?</p>
                        <button
                          onClick={(e) => {
                            animateButtonClick(e.currentTarget);
                            setTimeout(() => handleWalletModeToggle(true), 100);
                          }}
                          className="text-muted-foreground hover:text-foreground text-xs underline transition-colors"
                        >
                          Import Existing Wallet
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Import Wallet Card */}
              {!hasWallet && isImportWalletMode && (
                <Card ref={importWalletFormRef} className="bg-white/20 dark:bg-white/10 backdrop-blur-lg border-white/30 dark:border-white/20 shadow-2xl dark:shadow-white/5">
                  <CardContent className="p-4 md:p-6">
                    <div className="space-y-3 md:space-y-4 mt-4 md:mt-6">
                      <div className="text-center py-2 md:py-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                          <Download className="w-6 h-6 md:w-8 md:h-8 text-white" />
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1 md:mb-2">Import Existing Wallet</h3>
                        <p className="text-muted-foreground text-xs md:text-sm mb-2 md:mb-4">
                          Enter your 12-word seed phrase to recover your wallet
                        </p>
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label className="text-foreground text-sm">Seed Phrase</Label>
                        <div className="bg-background-100 dark:bg-background-900/50 border border-border rounded-lg p-3 md:p-4">
                          <div className="grid grid-cols-3 gap-2">
                            {seedWords.map((word, index) => (
                              <div key={index} className="relative">
                                <input
                                  type="text"
                                  value={word}
                                  onChange={(e) => handleSeedWordChange(index, e.target.value)}
                                  className="w-full bg-background dark:bg-background/10 border border-border rounded-lg p-2 text-center text-foreground font-medium placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                                  placeholder={`Word ${index + 1}`}
                                />
                                <span className="absolute -top-1 -left-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{index + 1}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="importWalletName" className="text-foreground text-sm">Wallet Name</Label>
                        <Input
                          id="importWalletName"
                          placeholder="Give your wallet a name"
                          value={walletName}
                          onChange={(e) => setWalletName(e.target.value)}
                          className="bg-background/30 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 text-sm h-9"
                        />
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="importPassword" className="text-foreground text-sm">New Password</Label>
                        <Input
                          id="importPassword"
                          type="password"
                          placeholder="Set new wallet password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-background/30 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 text-sm h-9"
                        />
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="importConfirmPassword" className="text-foreground text-sm">Confirm Password</Label>
                        <Input
                          id="importConfirmPassword"
                          type="password"
                          placeholder="Enter password again"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-background/30 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 text-sm h-9"
                        />
                      </div>

                      <Button
                        onClick={(e) => {
                          animateButtonClick(e.currentTarget);
                          setTimeout(() => handleImportWallet(), 100);
                        }}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-2 md:py-3 text-sm md:text-base mt-4"
                      >
                        {isLoading ? "Importing..." : "Import Wallet"}
                      </Button>

                      <div className="text-center">
                        <button
                          onClick={(e) => {
                            animateButtonClick(e.currentTarget);
                            setTimeout(() => handleWalletModeToggle(false), 100);
                          }}
                          className="text-muted-foreground hover:text-foreground text-xs underline transition-colors"
                        >
                          Back to Create Wallet
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Seed Phrase Confirmation Card */}
              {!hasWallet && showSeedPhrase && generatedWallet && (
                <Card ref={seedPhraseConfirmRef} className="bg-white/20 dark:bg-white/10 backdrop-blur-lg border-white/30 dark:border-white/20 shadow-2xl dark:shadow-white/5">
                  <CardContent className="p-4 md:p-6">
                    <div className="space-y-3 md:space-y-4 mt-4 md:mt-6">
                      <div className="text-center py-2 md:py-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                          <Check className="w-6 h-6 md:w-8 md:h-8 text-white" />
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1 md:mb-2">Save Your Seed Phrase</h3>
                        <p className="text-muted-foreground text-xs md:text-sm mb-2 md:mb-4">
                          Write down these 12 words in order. This is the only way to recover your wallet.
                        </p>
                      </div>

                      <div className="bg-background-900/50 border border-white/20 rounded-lg p-3 md:p-4">
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {generatedWallet.mnemonic?.split(' ').map((word, index) => (
                            <div key={index} className="bg-background/10 rounded-lg p-2 text-center">
                              <span className="text-muted-foreground text-xs block">{index + 1}</span>
                              <span className="text-foreground text-sm font-medium">{word}</span>
                            </div>
                          ))}
                        </div>

                        <Button
                          onClick={() => {
                            if (generatedWallet.mnemonic) {
                              navigator.clipboard.writeText(generatedWallet.mnemonic);
                              toast.success('Seed phrase copied to clipboard!');
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full bg-background/30 border-border text-foreground hover:bg-background/40"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy to Clipboard
                        </Button>
                      </div>

                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2 md:p-4">
                        <p className="text-destructive-foreground text-xs md:text-sm">
                          <strong>Warning:</strong> Never share your seed phrase with anyone. Store it safely offline.
                          If you lose it, you'll lose access to your wallet forever.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 md:p-4">
                          <p className="text-primary-foreground text-xs md:text-sm mb-3">
                            <strong>Confirm:</strong> Type "I have saved my seed phrase" to continue
                          </p>
                          <Input
                            type="text"
                            placeholder="Type the confirmation phrase..."
                            value={confirmPhrase}
                            onChange={(e) => setConfirmPhrase(e.target.value)}
                            className="bg-background/30 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 text-sm h-9"
                          />
                        </div>

                        <Button
                          onClick={(e) => {
                            animateButtonClick(e.currentTarget);
                            setTimeout(() => handleConfirmSeedPhrase(), 100);
                          }}
                          disabled={isLoading || confirmPhrase.toLowerCase().trim() !== "i have saved my seed phrase"}
                          className="w-full bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 text-white font-semibold py-2 md:py-3 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? "Creating Wallet..." : "Create Wallet"}
                        </Button>

                        <Button
                          onClick={(e) => {
                            animateButtonClick(e.currentTarget);
                            setTimeout(() => handleBackToCreateWallet(), 100);
                          }}
                          variant="outline"
                          className="w-full bg-background/30 border-border text-foreground hover:bg-background/40"
                        >
                          Back
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Bottom Text */}
          <p className="text-center text-muted-foreground text-xs md:text-sm mt-4 md:mt-6">
            Built on blockchain technology
          </p>
        </div>
      </div>
    </div>
  );
}