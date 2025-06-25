"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Wallet, Download, Plus } from "lucide-react";
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

// Background Gradient Animation Component
const BackgroundGradientAnimation = ({
  gradientBackgroundStart = "rgb(43, 58, 103)",
  gradientBackgroundEnd = "rgb(181, 107, 69)",
  firstColor = "255, 253, 130",
  secondColor = "255, 155, 113",
  thirdColor = "232, 72, 85",
  fourthColor = "181, 107, 69",
  fifthColor = "43, 58, 103",
  pointerColor = "140, 100, 255",
  size = "80%",
  blendingValue = "hard-light",
  children,
  className,
  interactive = true,
  containerClassName,
}: {
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  firstColor?: string;
  secondColor?: string;
  thirdColor?: string;
  fourthColor?: string;
  fifthColor?: string;
  pointerColor?: string;
  size?: string;
  blendingValue?: string;
  children?: React.ReactNode;
  className?: string;
  interactive?: boolean;
  containerClassName?: string;
}) => {
  const interactiveRef = React.useRef<HTMLDivElement>(null);
  const [curX, setCurX] = React.useState(0);
  const [curY, setCurY] = React.useState(0);
  const [tgX, setTgX] = React.useState(0);
  const [tgY, setTgY] = React.useState(0);
  const [isSafari, setIsSafari] = React.useState(false);

  React.useEffect(() => {
    document.body.style.setProperty("--gradient-background-start", gradientBackgroundStart);
    document.body.style.setProperty("--gradient-background-end", gradientBackgroundEnd);
    document.body.style.setProperty("--first-color", firstColor);
    document.body.style.setProperty("--second-color", secondColor);
    document.body.style.setProperty("--third-color", thirdColor);
    document.body.style.setProperty("--fourth-color", fourthColor);
    document.body.style.setProperty("--fifth-color", fifthColor);
    document.body.style.setProperty("--pointer-color", pointerColor);
    document.body.style.setProperty("--size", size);
    document.body.style.setProperty("--blending-value", blendingValue);
  }, []);

  React.useEffect(() => {
    function move() {
      if (!interactiveRef.current) return;
      setCurX(curX + (tgX - curX) / 20);
      setCurY(curY + (tgY - curY) / 20);
      interactiveRef.current.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
    }
    move();
  }, [tgX, tgY, curX, curY]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (interactiveRef.current) {
      const rect = interactiveRef.current.getBoundingClientRect();
      setTgX(event.clientX - rect.left);
      setTgY(event.clientY - rect.top);
    }
  };

  React.useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  return (
    <div
      className={cn(
        "h-screen w-screen relative overflow-hidden top-0 left-0",
        containerClassName
      )}
      style={{
        background: `linear-gradient(40deg, ${gradientBackgroundStart}, ${gradientBackgroundEnd})`
      }}
    >
      <svg className="hidden">
        <defs>
          <filter id="blurMe">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Background Animation Layer */}
      <div className={cn("absolute inset-0 gradients-container h-full w-full blur-lg", isSafari ? "blur-2xl" : "[filter:url(#blurMe)_blur(40px)]")}>
        <div
          className="absolute w-[80%] h-[80%] top-[calc(50%-40%)] left-[calc(50%-40%)] opacity-100 animate-[moveVertical_30s_ease_infinite]"
          style={{
            background: `radial-gradient(circle at center, rgba(${firstColor}, 0.8) 0%, rgba(${firstColor}, 0) 50%)`,
            mixBlendMode: blendingValue as any,
            transformOrigin: "center center"
          }}
        />
        <div
          className="absolute w-[80%] h-[80%] top-[calc(50%-40%)] left-[calc(50%-40%)] opacity-100 animate-[moveInCircle_20s_reverse_infinite]"
          style={{
            background: `radial-gradient(circle at center, rgba(${secondColor}, 0.8) 0%, rgba(${secondColor}, 0) 50%)`,
            mixBlendMode: blendingValue as any,
            transformOrigin: "calc(50% - 400px)"
          }}
        />
        <div
          className="absolute w-[80%] h-[80%] top-[calc(50%-40%)] left-[calc(50%-40%)] opacity-100 animate-[moveInCircle_40s_linear_infinite]"
          style={{
            background: `radial-gradient(circle at center, rgba(${thirdColor}, 0.8) 0%, rgba(${thirdColor}, 0) 50%)`,
            mixBlendMode: blendingValue as any,
            transformOrigin: "calc(50% + 400px)"
          }}
        />
        <div
          className="absolute w-[80%] h-[80%] top-[calc(50%-40%)] left-[calc(50%-40%)] opacity-70 animate-[moveHorizontal_40s_ease_infinite]"
          style={{
            background: `radial-gradient(circle at center, rgba(${fourthColor}, 0.8) 0%, rgba(${fourthColor}, 0) 50%)`,
            mixBlendMode: blendingValue as any,
            transformOrigin: "calc(50% - 200px)"
          }}
        />
        <div
          className="absolute w-[80%] h-[80%] top-[calc(50%-40%)] left-[calc(50%-40%)] opacity-100 animate-[moveInCircle_20s_ease_infinite]"
          style={{
            background: `radial-gradient(circle at center, rgba(${fifthColor}, 0.8) 0%, rgba(${fifthColor}, 0) 50%)`,
            mixBlendMode: blendingValue as any,
            transformOrigin: "calc(50% - 800px) calc(50% + 800px)"
          }}
        />
        {interactive && (
          <div
            ref={interactiveRef}
            onMouseMove={handleMouseMove}
            className="absolute w-full h-full -top-1/2 -left-1/2 opacity-70"
            style={{
              background: `radial-gradient(circle at center, rgba(${pointerColor}, 0.8) 0%, rgba(${pointerColor}, 0) 50%)`,
              mixBlendMode: blendingValue as any
            }}
          />
        )}
      </div>

      {/* Content Layer */}
      <div className={cn("relative z-10", className)}>{children}</div>

      <style jsx global>{`
        @keyframes moveHorizontal {
          0% { transform: translateX(-50%) translateY(-10%); }
          50% { transform: translateX(50%) translateY(10%); }
          100% { transform: translateX(-50%) translateY(-10%); }
        }
        @keyframes moveInCircle {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes moveVertical {
          0% { transform: translateY(-50%); }
          50% { transform: translateY(50%); }
          100% { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
};

interface WalletLoginProps {
  onWalletConnected: () => void;
}

export function WalletLogin({ onWalletConnected }: WalletLoginProps) {
  const { setWallet } = useWeb3();
  const [hasWallet, setHasWallet] = React.useState<boolean | null>(null);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [seedPhrase, setSeedPhrase] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [walletName, setWalletName] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // GSAP refs for animations
  const loginFormRef = React.useRef<HTMLDivElement>(null);
  const forgotPasswordFormRef = React.useRef<HTMLDivElement>(null);
  const createWalletFormRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

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

  // GSAP Animation Functions
  const animateFormTransition = (
    outElement: HTMLElement | null, 
    inElement: HTMLElement | null, 
    direction: 'toForgotPassword' | 'toLogin' | 'toImport'
  ) => {
    const tl = gsap.timeline();
    
    if (outElement) {
      // Exit animation based on direction
      const exitY = direction === 'toForgotPassword' ? -80 : direction === 'toLogin' ? 80 : -80;
      
      tl.to(outElement, {
        opacity: 0,
        y: exitY,
        scale: 0.92,
        duration: 0.4,
        ease: "power2.in"
      });
    }
    
    if (inElement) {
      // Entry animation based on direction
      const startY = direction === 'toForgotPassword' ? 80 : direction === 'toLogin' ? -80 : 80;
      
      tl.fromTo(inElement, 
        {
          opacity: 0,
          y: startY,
          scale: 0.92
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: "power2.out"
        },
        outElement ? 0.25 : 0
      );
    }
    
    return tl;
  };

  const animateButtonClick = (button: HTMLElement) => {
    gsap.to(button, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.out"
    });
  };

  // Enhanced forgot password toggle with GSAP
  const handleForgotPasswordToggle = (show: boolean) => {
    if (show) {
      // Forgot password form slides up from bottom
      animateFormTransition(loginFormRef.current, forgotPasswordFormRef.current, 'toForgotPassword');
    } else {
      // Login form slides down from top
      animateFormTransition(forgotPasswordFormRef.current, loginFormRef.current, 'toLogin');
    }
    setShowForgotPassword(show);
  };

  // Enhanced create/import wallet toggle
  const handleWalletModeToggle = (showImport: boolean) => {
    if (showImport) {
      // Import form slides up from bottom
      animateFormTransition(createWalletFormRef.current, forgotPasswordFormRef.current, 'toImport');
    }
    setShowForgotPassword(showImport);
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

      walletManager.saveWalletToStorage(wallet, password);

      const account: Account = {
        id: Date.now().toString(),
        name: wallet.name,
        address: wallet.address,
        type: 'generated'
      };

      walletService.addAccount(account);

      setWallet({
        address: wallet.address,
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
      toast.error('Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BackgroundGradientAnimation containerClassName="min-h-screen">
      <div className="min-h-screen p-2 sm:p-4 overflow-y-auto">
        <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-center py-4">
          {/* Logo and Title */}
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-primary to-accent rounded-2xl mb-3 md:mb-4">
              <Wallet className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Magic Wallet</h1>
            <p className="text-white/70 text-sm md:text-base">Smart Web3 wallet, securely manage your digital assets</p>
          </div>

          {/* Main Card */}
          <Card ref={cardRef} className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
            <CardContent className="p-4 md:p-6 relative overflow-hidden">
              {hasWallet === null ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto"></div>
                  <p className="text-white/70 mt-2">Checking wallet status...</p>
                </div>
              ) : (
                <div className="relative min-h-[400px] md:min-h-[450px]">
                  {hasWallet && !showForgotPassword && (
                    <div ref={loginFormRef} className="space-y-4 md:space-y-6 mt-4 md:mt-6 absolute inset-0 w-full">
                      <div className="text-center py-2 md:py-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                          <Wallet className="w-6 h-6 md:w-8 md:h-8 text-white" />
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-white mb-1 md:mb-2">Welcome Back</h3>
                        <p className="text-white/70 text-xs md:text-sm">
                          Enter your password to unlock your wallet
                        </p>
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="loginPassword" className="text-white/90 text-sm">Wallet Password</Label>
                        <Input
                          id="loginPassword"
                          type="password"
                          placeholder="Enter your wallet password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-primary/50 text-sm h-10 md:h-11"
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
                          className="text-white/70 hover:text-white text-xs underline transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>
                  )}

                  {hasWallet && showForgotPassword && (
                    <div ref={forgotPasswordFormRef} className="space-y-3 md:space-y-4 mt-4 md:mt-6 absolute inset-0 w-full">
                      <div className="text-center py-2 md:py-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                          <Download className="w-6 h-6 md:w-8 md:h-8 text-white" />
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-white mb-1 md:mb-2">Forgot Password?</h3>
                        <p className="text-white/70 text-xs md:text-sm mb-2 md:mb-4">
                          Use your seed phrase to recover your wallet
                        </p>
                      </div>
                      
                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="seedPhrase" className="text-white/90 text-sm">Seed Phrase</Label>
                        <Textarea
                          id="seedPhrase"
                          placeholder="Enter your 12 or 24 word seed phrase, separated by spaces"
                          value={seedPhrase}
                          onChange={(e) => setSeedPhrase(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-primary/50 text-sm"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="walletName" className="text-white/90 text-sm">Wallet Name</Label>
                        <Input
                          id="walletName"
                          placeholder="Give your wallet a name"
                          value={walletName}
                          onChange={(e) => setWalletName(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-primary/50 text-sm h-9"
                        />
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="password" className="text-white/90 text-sm">New Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Set new wallet password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-primary/50 text-sm h-9"
                        />
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="confirmPassword" className="text-white/90 text-sm">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Enter password again"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-primary/50 text-sm h-9"
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
                          className="text-white/70 hover:text-white text-xs underline transition-colors"
                        >
                          Back to Login
                        </button>
                      </div>
                    </div>
                  )}

                  {!hasWallet && (
                    <div ref={createWalletFormRef} className="space-y-3 md:space-y-4 mt-4 md:mt-6 absolute inset-0 w-full">
                      <div className="text-center py-2 md:py-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                          <Plus className="w-6 h-6 md:w-8 md:h-8 text-white" />
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-white mb-1 md:mb-2">Create New Wallet</h3>
                        <p className="text-white/70 text-xs md:text-sm mb-2 md:mb-4">
                          We'll generate a secure wallet and seed phrase for you
                        </p>
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="newWalletName" className="text-white/90 text-sm">Wallet Name</Label>
                        <Input
                          id="newWalletName"
                          placeholder="Give your wallet a name"
                          value={walletName}
                          onChange={(e) => setWalletName(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-primary/50 text-sm h-9"
                        />
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="newPassword" className="text-white/90 text-sm">Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="Set wallet password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-primary/50 text-sm h-9"
                        />
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="newConfirmPassword" className="text-white/90 text-sm">Confirm Password</Label>
                        <Input
                          id="newConfirmPassword"
                          type="password"
                          placeholder="Enter password again"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-primary/50 text-sm h-9"
                        />
                      </div>

                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 md:p-4">
                        <p className="text-yellow-200 text-xs md:text-sm">
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
                        <p className="text-white/50 text-xs mb-2">Already have a wallet?</p>
                        <button
                          onClick={(e) => {
                            animateButtonClick(e.currentTarget);
                            setTimeout(() => handleWalletModeToggle(true), 100);
                          }}
                          className="text-white/70 hover:text-white text-xs underline transition-colors"
                        >
                          Import Existing Wallet
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bottom Text */}
          <p className="text-center text-white/50 text-xs md:text-sm mt-4 md:mt-6">
            Built on blockchain technology
          </p>
        </div>
      </div>
    </BackgroundGradientAnimation>
  );
}