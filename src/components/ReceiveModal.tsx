'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Copy,
  Download,
  Share2,
  CheckCircle,
  Wallet,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { useWeb3 } from '@/contexts/Web3Context';
import { NETWORKS, formatAddress } from '@/lib/web3';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiveModal({ isOpen, onClose }: ReceiveModalProps) {
  const { wallet } = useWeb3();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const networkConfig = wallet ? NETWORKS[wallet.chainId as keyof typeof NETWORKS] : null;

  const copyAddress = async () => {
    if (!wallet) return;

    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopiedAddress(true);
      toast.success('地址已复制到剪贴板');
      
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
      toast.error('复制失败');
    }
  };

  const downloadQR = () => {
    if (!qrRef.current || !wallet) return;

    try {
      const svg = qrRef.current.querySelector('svg');
      if (!svg) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const data = new XMLSerializer().serializeToString(svg);
      const DOMURL = window.URL || window.webkitURL || window;

      const img = new Image();
      const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
      const url = DOMURL.createObjectURL(svgBlob);

      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        DOMURL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const link = document.createElement('a');
          link.download = `wallet-qr-${formatAddress(wallet.address)}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href);
        });
      };

      img.src = url;
      toast.success('QR码已下载');
    } catch (error) {
      console.error('Failed to download QR code:', error);
      toast.error('下载失败');
    }
  };

  const shareAddress = async () => {
    if (!wallet || !networkConfig) return;

    const shareData = {
      title: '我的钱包地址',
      text: `在 ${networkConfig.name} 网络上向我发送代币`,
      url: `https://etherscan.io/address/${wallet.address}` // 这里可以根据网络调整
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('分享成功');
      } else {
        // 降级到复制链接
        await navigator.clipboard.writeText(
          `${shareData.text}: ${wallet.address}`
        );
        toast.success('分享信息已复制到剪贴板');
      }
    } catch (error) {
      console.error('Failed to share:', error);
      toast.error('分享失败');
    }
  };

  const getExplorerUrl = () => {
    if (!wallet || !networkConfig) return '#';
    
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io/address/',
      137: 'https://polygonscan.com/address/',
      56: 'https://bscscan.com/address/',
      43114: 'https://snowtrace.io/address/',
      42161: 'https://arbiscan.io/address/',
      10: 'https://optimistic.etherscan.io/address/',
      8453: 'https://basescan.org/address/',
    };
    
    const explorerUrl = explorers[wallet.chainId];
    return explorerUrl ? `${explorerUrl}${wallet.address}` : '#';
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (!wallet || !networkConfig) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            接收代币
          </DialogTitle>
        </DialogHeader>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="space-y-6"
        >
          {/* Network Info */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: networkConfig.color }}
                  >
                    {networkConfig.symbol[0]}
                  </div>
                  <div>
                    <div className="font-semibold">{networkConfig.name}</div>
                    <div className="text-sm text-muted-foreground">
                      当前网络
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {networkConfig.symbol}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* QR Code */}
          <motion.div variants={itemVariants} className="text-center">
            <div className="bg-white p-6 rounded-lg inline-block" ref={qrRef}>
              <QRCodeSVG
                value={wallet.address}
                size={200}
                level="H"
                includeMargin={true}
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              扫描二维码获取钱包地址
            </p>
          </motion.div>

          {/* Address */}
          <motion.div variants={itemVariants}>
            <div className="space-y-2">
              <label className="text-sm font-medium">钱包地址</label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Wallet className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <code className="text-sm flex-1 min-w-0 break-all">
                  {wallet.address}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  className="flex-shrink-0"
                >
                  {copiedAddress ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          <Separator />

          {/* Actions */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={copyAddress}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Copy className="w-4 h-4" />
                <span className="text-xs">复制地址</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQR}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Download className="w-4 h-4" />
                <span className="text-xs">下载QR</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={shareAddress}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-xs">分享</span>
              </Button>
            </div>
          </motion.div>

          {/* Explorer Link */}
          <motion.div variants={itemVariants}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const url = getExplorerUrl();
                if (url !== '#') {
                  window.open(url, '_blank');
                }
              }}
              className="w-full flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              在区块链浏览器中查看
            </Button>
          </motion.div>

          {/* Warning */}
          <motion.div variants={itemVariants}>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>注意：</strong>只发送 {networkConfig.name} 网络上的代币到此地址。发送其他网络的代币可能导致永久丢失。
              </p>
            </div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}