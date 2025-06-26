"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  Fuel,
  RefreshCw,
  BarChart3,
  Timer,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useWeb3 } from '@/contexts/Web3Context';
import { gasOptimizer, type GasPrice, type GasPrediction, type GasOptimizationSuggestion } from '@/lib/gas-optimizer';

interface GasOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasLimit?: number;
}

export function GasOptimizerModal({ isOpen, onClose, gasLimit = 21000 }: GasOptimizerModalProps) {
  const { wallet } = useWeb3();
  
  const [gasPrice, setGasPrice] = useState<GasPrice | null>(null);
  const [prediction, setPrediction] = useState<GasPrediction | null>(null);
  const [suggestions, setSuggestions] = useState<GasOptimizationSuggestion[]>([]);
  const [networkTips, setNetworkTips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUrgency, setSelectedUrgency] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  // Load gas data when modal opens
  useEffect(() => {
    if (isOpen && wallet) {
      loadGasData();
    }
  }, [isOpen, wallet]);

  const loadGasData = async () => {
    setIsLoading(true);
    try {
      const [currentGasPrice, gasPrediction, optimizationSuggestions] = await Promise.all([
        gasOptimizer.getCurrentGasPrice(),
        gasOptimizer.getGasPrediction(),
        gasOptimizer.getOptimizationSuggestions(gasLimit)
      ]);

      setGasPrice(currentGasPrice);
      setPrediction(gasPrediction);
      setSuggestions(optimizationSuggestions);
      setNetworkTips(gasOptimizer.getNetworkGasTips());
    } catch (error) {
      console.error('Failed to load gas data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case 'low':
        return { label: '慢速', color: 'text-blue-600', bgColor: 'bg-blue-50', time: gasPrice?.slowWait };
      case 'medium':
        return { label: '标准', color: 'text-green-600', bgColor: 'bg-green-50', time: gasPrice?.standardWait };
      case 'high':
        return { label: '快速', color: 'text-orange-600', bgColor: 'bg-orange-50', time: gasPrice?.fastWait };
      case 'urgent':
        return { label: '紧急', color: 'text-red-600', bgColor: 'bg-red-50', time: gasPrice?.instantWait };
      default:
        return { label: '标准', color: 'text-green-600', bgColor: 'bg-green-50', time: gasPrice?.standardWait };
    }
  };

  const formatWaitTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`;
    return `${Math.round(seconds / 3600)}小时`;
  };

  const getOptimalGasPrice = () => {
    if (!gasPrice) return '0';
    return gasOptimizer.getOptimalGasPrice(selectedUrgency, gasPrice);
  };

  const getPredictionIcon = () => {
    if (!prediction) return <TrendingUp className="w-4 h-4" />;
    
    switch (prediction.prediction.nextHour) {
      case 'increase':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decrease':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <BarChart3 className="w-4 h-4 text-blue-500" />;
    }
  };

  const getRecommendationColor = () => {
    if (!prediction) return 'text-muted-foreground';
    
    switch (prediction.prediction.recommendedAction) {
      case 'send_now':
        return 'text-green-600';
      case 'send_fast':
        return 'text-orange-600';
      case 'wait':
        return 'text-blue-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getRecommendationText = () => {
    if (!prediction) return '获取建议中...';
    
    switch (prediction.prediction.recommendedAction) {
      case 'send_now':
        return '建议现在发送交易';
      case 'send_fast':
        return '建议使用较高 Gas 价格';
      case 'wait':
        return '建议等待 Gas 费用降低';
      default:
        return '当前可以正常发送';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="bg-background border shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Fuel className="w-6 h-6" />
                Gas 费优化器
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={loadGasData}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Current Gas Prices */}
              {gasPrice && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3"
                >
                  {[
                    { key: 'slow', label: '慢速', price: gasPrice.slow, wait: gasPrice.slowWait, urgency: 'low' },
                    { key: 'standard', label: '标准', price: gasPrice.standard, wait: gasPrice.standardWait, urgency: 'medium' },
                    { key: 'fast', label: '快速', price: gasPrice.fast, wait: gasPrice.fastWait, urgency: 'high' },
                    { key: 'instant', label: '紧急', price: gasPrice.instant, wait: gasPrice.instantWait, urgency: 'urgent' }
                  ].map((option) => {
                    const config = getUrgencyConfig(option.urgency);
                    const isSelected = selectedUrgency === option.urgency;
                    
                    return (
                      <Card
                        key={option.key}
                        className={cn(
                          "p-3 cursor-pointer transition-all border-2",
                          isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setSelectedUrgency(option.urgency as any)}
                      >
                        <div className="text-center space-y-1">
                          <div className={cn("text-xs font-medium", config.color)}>
                            {config.label}
                          </div>
                          <div className="text-lg font-bold">
                            {parseFloat(option.price).toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Gwei
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatWaitTime(option.wait)}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </motion.div>
              )}

              {/* Gas Prediction */}
              {prediction && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="p-4 bg-muted/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getPredictionIcon()}
                        <span className="font-medium">Gas 价格预测</span>
                      </div>
                      <Badge variant="outline">
                        置信度: {prediction.prediction.confidence}%
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">下一小时趋势:</span>
                        <span className={cn(
                          "text-sm font-medium",
                          prediction.prediction.nextHour === 'increase' ? 'text-red-600' :
                          prediction.prediction.nextHour === 'decrease' ? 'text-green-600' : 'text-blue-600'
                        )}>
                          {prediction.prediction.nextHour === 'increase' ? '上涨' :
                           prediction.prediction.nextHour === 'decrease' ? '下降' : '稳定'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">建议操作:</span>
                        <span className={cn("text-sm font-medium", getRecommendationColor())}>
                          {getRecommendationText()}
                        </span>
                      </div>
                      
                      {prediction.prediction.bestTimeToSend > Date.now() && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">最佳发送时间:</span>
                          <span className="text-sm font-medium">
                            {formatWaitTime((prediction.prediction.bestTimeToSend - Date.now()) / 1000)}后
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Optimization Suggestions */}
              {suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-lg font-semibold mb-3">优化建议</h3>
                  <div className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            <span className="font-medium">
                              {suggestion.type === 'eip1559' ? 'EIP-1559 优化' : '传统 Gas 优化'}
                            </span>
                          </div>
                          <Badge variant="outline">
                            置信度: {suggestion.confidence}%
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">预估费用:</span>
                            <div className="font-medium">{parseFloat(suggestion.estimatedCost).toFixed(6)} ETH</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">预估时间:</span>
                            <div className="font-medium">{formatWaitTime(suggestion.estimatedTime)}</div>
                          </div>
                          {parseFloat(suggestion.savings) > 0 && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">可节省:</span>
                              <span className="font-medium text-green-600 ml-2">
                                {parseFloat(suggestion.savings).toFixed(6)} ETH
                              </span>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Cost Estimation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span className="font-medium">费用估算</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Gas 价格</div>
                      <div className="text-lg font-bold">{getOptimalGasPrice()} Gwei</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Gas 限制</div>
                      <div className="text-lg font-bold">{gasLimit.toLocaleString()}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-sm text-muted-foreground">总费用</div>
                      <div className="text-xl font-bold">
                        {((parseFloat(getOptimalGasPrice()) * gasLimit) / 1e9).toFixed(6)} ETH
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Network Tips */}
              {networkTips.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">网络优化提示</span>
                    </div>
                    <ul className="space-y-2">
                      {networkTips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  关闭
                </Button>
                <Button 
                  onClick={() => {
                    // This would typically apply the selected gas settings
                    // For now, just close the modal
                    onClose();
                  }}
                  className="flex-1"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  应用设置
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}