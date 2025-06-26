"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  FileText,
  Calendar,
  Filter,
  CheckCircle,
  AlertCircle,
  Info,
  BarChart3,
  Clock,
  DollarSign,
  ArrowUpDown,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useWeb3 } from '@/contexts/Web3Context';
import { exportService, type ExportOptions, type TransactionRecord } from '@/lib/export-service';
import { toast } from 'sonner';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions?: any[]; // Wallet transactions from context
}

export function ExportModal({ isOpen, onClose, transactions = [] }: ExportModalProps) {
  const { wallet } = useWeb3();
  
  const [step, setStep] = useState<'options' | 'preview' | 'exporting' | 'success'>('options');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeTokenTransfers: true,
    includeInternalTxs: false,
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);

  // Convert wallet transactions to standard format
  const standardTransactions = wallet ? 
    exportService.convertWalletTransactions(
      transactions,
      wallet.address,
      wallet.chainId,
      'Ethereum' // This should come from network config
    ) : [];

  // Update export options when dates change
  useEffect(() => {
    const updatedOptions = { ...exportOptions };
    
    if (dateFrom) {
      updatedOptions.dateFrom = new Date(dateFrom);
    } else {
      delete updatedOptions.dateFrom;
    }
    
    if (dateTo) {
      updatedOptions.dateTo = new Date(dateTo);
    } else {
      delete updatedOptions.dateTo;
    }
    
    setExportOptions(updatedOptions);
  }, [dateFrom, dateTo]);

  // Get transaction summary for preview
  useEffect(() => {
    if (step === 'preview' && standardTransactions.length > 0) {
      const newSummary = exportService.getTransactionSummary(standardTransactions, exportOptions);
      setSummary(newSummary);
    }
  }, [step, exportOptions, standardTransactions]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('options');
      setDateFrom('');
      setDateTo('');
      setSummary(null);
      setExportResult(null);
    }
  }, [isOpen]);

  const handleExportOptionChange = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePresetSelect = (presetKey: string) => {
    const presets = exportService.getPresetConfigurations();
    const preset = presets[presetKey];
    
    if (preset) {
      setExportOptions(prev => ({ ...prev, ...preset }));
      
      // Update date inputs if preset includes dates
      if (preset.dateFrom) {
        setDateFrom(preset.dateFrom.toISOString().split('T')[0]);
      }
      if (preset.dateTo) {
        setDateTo(preset.dateTo.toISOString().split('T')[0]);
      }
    }
  };

  const handleNext = () => {
    // Validate options
    const errors = exportService.validateExportOptions(exportOptions);
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }
    
    if (standardTransactions.length === 0) {
      toast.error('No transactions available to export');
      return;
    }
    
    setStep('preview');
  };

  const handleExport = async () => {
    setStep('exporting');
    setIsExporting(true);
    
    try {
      const result = await exportService.exportTransactions(standardTransactions, exportOptions);
      
      setExportResult(result);
      
      if (result.success) {
        setStep('success');
        toast.success(`Successfully exported ${result.recordCount} transactions`);
      } else {
        toast.error(result.error || 'Export failed');
        setStep('preview');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
      setStep('preview');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
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
                <Download className="w-6 h-6" />
                导出交易记录
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Step: Export Options */}
              {step === 'options' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Format Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">导出格式</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Card
                        className={cn(
                          "p-4 cursor-pointer transition-all border-2",
                          exportOptions.format === 'csv' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        )}
                        onClick={() => handleExportOptionChange('format', 'csv')}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="font-medium">CSV 格式</div>
                            <div className="text-xs text-muted-foreground">适合 Excel 分析</div>
                          </div>
                        </div>
                      </Card>
                      
                      <Card
                        className={cn(
                          "p-4 cursor-pointer transition-all border-2",
                          exportOptions.format === 'json' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        )}
                        onClick={() => handleExportOptionChange('format', 'json')}
                      >
                        <div className="flex items-center gap-3">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium">JSON 格式</div>
                            <div className="text-xs text-muted-foreground">适合程序分析</div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Preset Configurations */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">快速配置</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePresetSelect('last-month-csv')}
                      >
                        最近一月 (CSV)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePresetSelect('last-year-json')}
                      >
                        最近一年 (JSON)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePresetSelect('all-transactions-csv')}
                      >
                        全部交易 (CSV)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePresetSelect('high-value-only')}
                      >
                        高价值交易
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Date Range */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      日期范围
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="dateFrom" className="text-sm">开始日期</Label>
                        <Input
                          id="dateFrom"
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateTo" className="text-sm">结束日期</Label>
                        <Input
                          id="dateTo"
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filter Options */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      筛选选项
                    </Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeTokenTransfers"
                          checked={exportOptions.includeTokenTransfers}
                          onCheckedChange={(checked) => 
                            handleExportOptionChange('includeTokenTransfers', checked)
                          }
                        />
                        <Label htmlFor="includeTokenTransfers" className="text-sm">
                          包含代币转账
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeInternalTxs"
                          checked={exportOptions.includeInternalTxs}
                          onCheckedChange={(checked) => 
                            handleExportOptionChange('includeInternalTxs', checked)
                          }
                        />
                        <Label htmlFor="includeInternalTxs" className="text-sm">
                          包含内部交易
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4" />
                      排序方式
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">排序字段</Label>
                        <Select
                          value={exportOptions.sortBy}
                          onValueChange={(value: any) => handleExportOptionChange('sortBy', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="timestamp">时间</SelectItem>
                            <SelectItem value="value">金额</SelectItem>
                            <SelectItem value="gasUsed">Gas 使用量</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm">排序顺序</Label>
                        <Select
                          value={exportOptions.sortOrder}
                          onValueChange={(value: any) => handleExportOptionChange('sortOrder', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desc">降序 (新到旧)</SelectItem>
                            <SelectItem value="asc">升序 (旧到新)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                      取消
                    </Button>
                    <Button onClick={handleNext} className="flex-1">
                      下一步
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step: Preview */}
              {step === 'preview' && summary && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">导出预览</h3>
                    <p className="text-muted-foreground">
                      确认以下信息后开始导出
                    </p>
                  </div>

                  <Card className="p-4 bg-muted/30">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="font-medium">导出格式:</span>
                        <Badge variant="outline">
                          {exportOptions.format.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="font-medium">记录数量:</span>
                        <span className="font-bold text-primary">
                          {summary.totalRecords} 条
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="font-medium">日期范围:</span>
                        <span>
                          {formatDate(summary.dateRange.from)} - {formatDate(summary.dateRange.to)}
                        </span>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <div className="font-medium mb-2">交易类型分布:</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span>发送:</span>
                            <span>{summary.types.send}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>接收:</span>
                            <span>{summary.types.receive}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>合约:</span>
                            <span>{summary.types.contract}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>交换:</span>
                            <span>{summary.types.swap}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setStep('options')}
                      className="flex-1"
                    >
                      返回修改
                    </Button>
                    <Button 
                      onClick={handleExport}
                      className="flex-1"
                      disabled={isExporting}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      开始导出
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step: Exporting */}
              {step === 'exporting' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                    <Download className="w-8 h-8 animate-pulse text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">正在导出交易记录</h3>
                    <p className="text-muted-foreground">
                      请稍候，正在生成您的交易记录文件...
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step: Success */}
              {step === 'success' && exportResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">导出成功！</h3>
                    <p className="text-muted-foreground">
                      您的交易记录已成功导出到下载文件夹
                    </p>
                  </div>

                  <Card className="p-4 bg-green-50 text-left">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>文件名:</span>
                        <span className="font-mono text-xs">{exportResult.filename}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>记录数量:</span>
                        <span className="font-bold">{exportResult.recordCount} 条</span>
                      </div>
                      <div className="flex justify-between">
                        <span>格式:</span>
                        <span className="uppercase font-bold">{exportOptions.format}</span>
                      </div>
                    </div>
                  </Card>

                  <Button onClick={onClose} className="w-full">
                    完成
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}