// Transaction Export Service for CSV and JSON formats
import { Address } from 'viem';

export interface TransactionRecord {
  hash: string;
  blockNumber: number;
  timestamp: Date;
  from: Address;
  to: Address;
  value: string;
  gasUsed: string;
  gasPrice: string;
  status: 'success' | 'failed';
  type: 'send' | 'receive' | 'contract' | 'swap';
  tokenSymbol?: string;
  tokenAmount?: string;
  usdValue?: number;
  chainId: number;
  chainName: string;
}

export interface ExportOptions {
  format: 'csv' | 'json';
  dateFrom?: Date;
  dateTo?: Date;
  includeTokenTransfers: boolean;
  includeInternalTxs: boolean;
  sortBy: 'timestamp' | 'value' | 'gasUsed';
  sortOrder: 'asc' | 'desc';
}

export interface ExportResult {
  success: boolean;
  filename: string;
  data?: string;
  error?: string;
  recordCount: number;
}

class TransactionExportService {
  // Export transactions to specified format
  async exportTransactions(
    transactions: TransactionRecord[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Filter transactions based on options
      let filteredTransactions = this.filterTransactions(transactions, options);
      
      // Sort transactions
      filteredTransactions = this.sortTransactions(filteredTransactions, options);

      // Generate filename
      const filename = this.generateFilename(options);

      // Export to specified format
      let data: string;
      if (options.format === 'csv') {
        data = this.exportToCSV(filteredTransactions);
      } else {
        data = this.exportToJSON(filteredTransactions);
      }

      // Trigger download
      this.downloadFile(data, filename, options.format);

      return {
        success: true,
        filename,
        data,
        recordCount: filteredTransactions.length
      };
    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Export failed',
        recordCount: 0
      };
    }
  }

  // Filter transactions based on date range and options
  private filterTransactions(
    transactions: TransactionRecord[],
    options: ExportOptions
  ): TransactionRecord[] {
    let filtered = [...transactions];

    // Date range filter
    if (options.dateFrom) {
      filtered = filtered.filter(tx => tx.timestamp >= options.dateFrom!);
    }
    if (options.dateTo) {
      filtered = filtered.filter(tx => tx.timestamp <= options.dateTo!);
    }

    // Type filters
    if (!options.includeTokenTransfers) {
      filtered = filtered.filter(tx => !tx.tokenSymbol);
    }

    // Additional filtering logic can be added here

    return filtered;
  }

  // Sort transactions
  private sortTransactions(
    transactions: TransactionRecord[],
    options: ExportOptions
  ): TransactionRecord[] {
    const sortedTransactions = [...transactions];

    sortedTransactions.sort((a, b) => {
      let compareValue = 0;

      switch (options.sortBy) {
        case 'timestamp':
          compareValue = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'value':
          compareValue = parseFloat(a.value) - parseFloat(b.value);
          break;
        case 'gasUsed':
          compareValue = parseFloat(a.gasUsed) - parseFloat(b.gasUsed);
          break;
      }

      return options.sortOrder === 'desc' ? -compareValue : compareValue;
    });

    return sortedTransactions;
  }

  // Export to CSV format
  private exportToCSV(transactions: TransactionRecord[]): string {
    if (transactions.length === 0) {
      return 'No transactions to export';
    }

    // CSV headers
    const headers = [
      'Transaction Hash',
      'Block Number',
      'Timestamp',
      'Date',
      'From',
      'To',
      'Value (ETH)',
      'Gas Used',
      'Gas Price (Gwei)',
      'Status',
      'Type',
      'Token Symbol',
      'Token Amount',
      'USD Value',
      'Chain ID',
      'Chain Name'
    ];

    // Create CSV rows
    const rows = transactions.map(tx => [
      tx.hash,
      tx.blockNumber.toString(),
      tx.timestamp.getTime().toString(),
      tx.timestamp.toISOString(),
      tx.from,
      tx.to,
      tx.value,
      tx.gasUsed,
      (parseFloat(tx.gasPrice) / 1e9).toString(), // Convert to Gwei
      tx.status,
      tx.type,
      tx.tokenSymbol || '',
      tx.tokenAmount || '',
      tx.usdValue?.toString() || '',
      tx.chainId.toString(),
      tx.chainName
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  // Export to JSON format
  private exportToJSON(transactions: TransactionRecord[]): string {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalRecords: transactions.length,
      transactions: transactions.map(tx => ({
        hash: tx.hash,
        blockNumber: tx.blockNumber,
        timestamp: tx.timestamp.toISOString(),
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        gasPriceGwei: (parseFloat(tx.gasPrice) / 1e9).toString(),
        status: tx.status,
        type: tx.type,
        tokenSymbol: tx.tokenSymbol,
        tokenAmount: tx.tokenAmount,
        usdValue: tx.usdValue,
        chainId: tx.chainId,
        chainName: tx.chainName
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Generate filename with timestamp
  private generateFilename(options: ExportOptions): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    
    let filename = `wallet-transactions-${dateStr}-${timeStr}`;
    
    if (options.dateFrom && options.dateTo) {
      const fromStr = options.dateFrom.toISOString().split('T')[0];
      const toStr = options.dateTo.toISOString().split('T')[0];
      filename = `wallet-transactions-${fromStr}-to-${toStr}`;
    }
    
    return `${filename}.${options.format}`;
  }

  // Download file to user's computer
  private downloadFile(data: string, filename: string, format: string): void {
    const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  }

  // Get transaction summary for export preview
  getTransactionSummary(transactions: TransactionRecord[], options: ExportOptions) {
    const filteredTransactions = this.filterTransactions(transactions, options);
    
    const summary = {
      totalRecords: filteredTransactions.length,
      dateRange: {
        from: filteredTransactions.length > 0 
          ? Math.min(...filteredTransactions.map(tx => tx.timestamp.getTime()))
          : null,
        to: filteredTransactions.length > 0 
          ? Math.max(...filteredTransactions.map(tx => tx.timestamp.getTime()))
          : null
      },
      types: {
        send: filteredTransactions.filter(tx => tx.type === 'send').length,
        receive: filteredTransactions.filter(tx => tx.type === 'receive').length,
        contract: filteredTransactions.filter(tx => tx.type === 'contract').length,
        swap: filteredTransactions.filter(tx => tx.type === 'swap').length
      },
      chains: {} as Record<string, number>
    };

    // Count transactions by chain
    filteredTransactions.forEach(tx => {
      summary.chains[tx.chainName] = (summary.chains[tx.chainName] || 0) + 1;
    });

    return summary;
  }

  // Validate export options
  validateExportOptions(options: Partial<ExportOptions>): string[] {
    const errors: string[] = [];

    if (!options.format || !['csv', 'json'].includes(options.format)) {
      errors.push('Invalid format. Must be "csv" or "json".');
    }

    if (options.dateFrom && options.dateTo && options.dateFrom > options.dateTo) {
      errors.push('Start date must be before end date.');
    }

    if (options.dateFrom && options.dateFrom > new Date()) {
      errors.push('Start date cannot be in the future.');
    }

    if (!options.sortBy || !['timestamp', 'value', 'gasUsed'].includes(options.sortBy)) {
      errors.push('Invalid sort field.');
    }

    if (!options.sortOrder || !['asc', 'desc'].includes(options.sortOrder)) {
      errors.push('Invalid sort order.');
    }

    return errors;
  }

  // Convert wallet transaction history to standard format
  convertWalletTransactions(
    walletTransactions: any[],
    walletAddress: Address,
    chainId: number,
    chainName: string
  ): TransactionRecord[] {
    return walletTransactions.map(tx => ({
      hash: tx.hash || tx.id,
      blockNumber: tx.blockNumber || 0,
      timestamp: tx.timestamp instanceof Date ? tx.timestamp : new Date(tx.timestamp),
      from: tx.from || (tx.type === 'send' ? walletAddress : tx.to || '0x'),
      to: tx.to || (tx.type === 'receive' ? walletAddress : tx.from || '0x'),
      value: tx.value?.toString() || tx.amount?.toString() || '0',
      gasUsed: tx.gasUsed?.toString() || '21000',
      gasPrice: tx.gasPrice?.toString() || '20000000000', // 20 Gwei default
      status: tx.status === 'failed' ? 'failed' : 'success',
      type: tx.type || 'send',
      tokenSymbol: tx.asset !== 'ETH' ? tx.asset : undefined,
      tokenAmount: tx.asset !== 'ETH' ? tx.amount : undefined,
      usdValue: tx.value,
      chainId,
      chainName
    }));
  }

  // Get preset export configurations
  getPresetConfigurations(): Record<string, Partial<ExportOptions>> {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    return {
      'last-month-csv': {
        format: 'csv',
        dateFrom: oneMonthAgo,
        dateTo: now,
        includeTokenTransfers: true,
        includeInternalTxs: false,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      },
      'last-year-json': {
        format: 'json',
        dateFrom: oneYearAgo,
        dateTo: now,
        includeTokenTransfers: true,
        includeInternalTxs: true,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      },
      'all-transactions-csv': {
        format: 'csv',
        includeTokenTransfers: true,
        includeInternalTxs: true,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      },
      'high-value-only': {
        format: 'csv',
        includeTokenTransfers: false,
        includeInternalTxs: false,
        sortBy: 'value',
        sortOrder: 'desc'
      }
    };
  }
}

export const exportService = new TransactionExportService();