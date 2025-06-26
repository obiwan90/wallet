import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  parseEther,
  parseUnits,
  getAddress,
  formatUnits,
  encodeFunctionData,
  type PublicClient,
  type WalletClient, 
  type Address,
  type Chain,
  type Hash
} from 'viem';
import { priceService } from './price-service';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { mainnet, polygon, bsc, avalanche, arbitrum, optimism, base, sepolia, polygonMumbai, bscTestnet } from 'viem/chains';

export interface WalletInfo {
  address: Address;
  balance: string;
  chainId: number;
  chain: Chain;
}

export interface Account {
  id: string;
  name: string;
  address: Address;
  type: 'imported' | 'generated';
  encrypted?: string; // Encrypted private key or mnemonic
}

export interface TokenInfo {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  balance?: string;
  price?: number;
  chainId: number;
}

export interface TokenBalance {
  token: TokenInfo;
  balance: string;
  formattedBalance: string;
  balanceWei: bigint;
  priceUsd?: number;
  valueUsd?: number;
  change24h?: number;
}

export interface TransactionRequest {
  to: Address;
  value?: string; // in native currency (ETH, MATIC, etc.)
  data?: `0x${string}`;
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export interface TokenTransferRequest {
  tokenAddress: Address;
  to: Address;
  amount: string; // in token units (e.g., "1.5" for 1.5 USDC)
}

export interface TransactionResult {
  hash: Hash;
  success: boolean;
  error?: string;
  receipt?: any;
}

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCost: string; // in native currency
}

export interface NetworkInfo {
  name: string;
  symbol: string;
  chain: Chain;
  color: string;
  rpcUrls: string[];
  isTestnet?: boolean;
  isCustom?: boolean;
}

export interface TransactionHistory {
  hash: Hash;
  from: Address;
  to: Address;
  value: string;
  formattedValue: string;
  gasUsed: string;
  gasPrice: string;
  blockNumber: number;
  timestamp: number;
  status: 'success' | 'failed' | 'pending';
  type: 'send' | 'receive' | 'contract';
  tokenSymbol?: string;
  tokenAddress?: Address;
  tokenAmount?: string;
  chainId: number;
}

// ERC-20 ABI for basic token operations
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  }
] as const;

// Network configurations with CORS-enabled RPC endpoints
export const NETWORKS = {
  1: { 
    name: 'Ethereum', 
    symbol: 'ETH', 
    chain: mainnet, 
    color: '#627EEA', 
    rpcUrls: [
      'https://ethereum.publicnode.com',
      'https://rpc.ankr.com/eth',
      'https://1rpc.io/eth',
      'https://cloudflare-eth.com'
    ]
  },
  137: { 
    name: 'Polygon', 
    symbol: 'MATIC', 
    chain: polygon, 
    color: '#8247E5', 
    rpcUrls: [
      'https://polygon-rpc.com',
      'https://rpc.ankr.com/polygon',
      'https://1rpc.io/matic',
      'https://polygon.publicnode.com'
    ]
  },
  56: { 
    name: 'BSC', 
    symbol: 'BNB', 
    chain: bsc, 
    color: '#F3BA2F', 
    rpcUrls: [
      'https://bsc-dataseed.binance.org',
      'https://rpc.ankr.com/bsc',
      'https://1rpc.io/bnb',
      'https://bsc.publicnode.com'
    ]
  },
  43114: { 
    name: 'Avalanche', 
    symbol: 'AVAX', 
    chain: avalanche, 
    color: '#E84142', 
    rpcUrls: [
      'https://api.avax.network/ext/bc/C/rpc',
      'https://rpc.ankr.com/avalanche',
      'https://1rpc.io/avax/c',
      'https://avalanche.publicnode.com'
    ]
  },
  42161: { 
    name: 'Arbitrum', 
    symbol: 'ETH', 
    chain: arbitrum, 
    color: '#28A0F0', 
    rpcUrls: [
      'https://arb1.arbitrum.io/rpc',
      'https://rpc.ankr.com/arbitrum',
      'https://1rpc.io/arb',
      'https://arbitrum.publicnode.com'
    ]
  },
  10: { 
    name: 'Optimism', 
    symbol: 'ETH', 
    chain: optimism, 
    color: '#FF0420', 
    rpcUrls: [
      'https://mainnet.optimism.io',
      'https://rpc.ankr.com/optimism',
      'https://1rpc.io/op',
      'https://optimism.publicnode.com'
    ]
  },
  8453: { 
    name: 'Base', 
    symbol: 'ETH', 
    chain: base, 
    color: '#0052FF', 
    rpcUrls: [
      'https://mainnet.base.org',
      'https://rpc.ankr.com/base',
      'https://1rpc.io/base',
      'https://base.publicnode.com'
    ]
  },
  // Testnets
  11155111: {
    name: 'Sepolia',
    symbol: 'ETH',
    chain: sepolia,
    color: '#627EEA',
    rpcUrls: [
      'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      'https://rpc.sepolia.org',
      'https://rpc.ankr.com/eth_sepolia'
    ],
    isTestnet: true
  },
  80001: {
    name: 'Mumbai',
    symbol: 'MATIC',
    chain: polygonMumbai,
    color: '#8247E5',
    rpcUrls: [
      'https://rpc-mumbai.maticvigil.com',
      'https://matic-mumbai.chainstacklabs.com',
      'https://rpc.ankr.com/polygon_mumbai'
    ],
    isTestnet: true
  },
  97: {
    name: 'BSC Testnet',
    symbol: 'BNB',
    chain: bscTestnet,
    color: '#F3BA2F',
    rpcUrls: [
      'https://data-seed-prebsc-1-s1.binance.org:8545',
      'https://data-seed-prebsc-2-s1.binance.org:8545'
    ],
    isTestnet: true
  }
};

export class WalletService {
  private publicClient: PublicClient | null = null;
  private walletClient: WalletClient | null = null;
  private currentChain: Chain = mainnet;
  private accounts: Account[] = [];
  private currentAccountId: string | null = null;
  private currentRpcIndex: number = 0;
  private currentAccount: PrivateKeyAccount | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const networkConfig = NETWORKS[this.currentChain.id as keyof typeof NETWORKS];
    if (networkConfig) {
      const rpcUrl = networkConfig.rpcUrls[this.currentRpcIndex];
      
      this.publicClient = createPublicClient({
        chain: this.currentChain,
        transport: http(rpcUrl)
      });

      // Initialize wallet client if we have an account
      if (this.currentAccount) {
        this.walletClient = createWalletClient({
          account: this.currentAccount,
          chain: this.currentChain,
          transport: http(rpcUrl)
        });
      }
    }
  }

  // Set the current account for transaction signing
  setCurrentAccount(privateKey: `0x${string}`) {
    try {
      this.currentAccount = privateKeyToAccount(privateKey);
      this.initializeClient(); // Reinitialize to include wallet client
    } catch (error) {
      console.error('Failed to set current account:', error);
      throw new Error('Invalid private key');
    }
  }

  // Clear the current account (for security)
  clearCurrentAccount() {
    this.currentAccount = null;
    this.walletClient = null;
  }

  // Helper method for RPC requests with CORS fallback
  private async makeRpcRequest(method: string, params: any[] = []): Promise<any> {
    const networkConfig = NETWORKS[this.currentChain.id as keyof typeof NETWORKS];
    if (!networkConfig) {
      throw new Error(`Unsupported network: ${this.currentChain.id}`);
    }

    const rpcBody = {
      jsonrpc: '2.0',
      method,
      params,
      id: Date.now()
    };

    // Try direct RPC request first
    for (const rpcUrl of networkConfig.rpcUrls) {
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rpcBody),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.error) {
            throw new Error(data.error.message || 'RPC error');
          }
          return data.result;
        }
      } catch (error) {
        console.warn(`Direct RPC failed for ${rpcUrl}:`, error);
        // Continue to next RPC URL or fallback
      }
    }

    // Fallback to proxy API if direct requests fail
    try {
      const response = await fetch('/api/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chainId: this.currentChain.id,
          rpcUrl: networkConfig.rpcUrls[0], // Use first RPC URL for proxy
          body: rpcBody,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error.message || 'RPC error');
        }
        return data.result;
      }
    } catch (error) {
      console.warn('Proxy RPC also failed:', error);
    }

    throw new Error('All RPC endpoints failed');
  }

  private async retryWithFallback<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    const networkConfig = NETWORKS[this.currentChain.id as keyof typeof NETWORKS];
    if (!networkConfig) {
      throw new Error(`Unsupported network: ${this.currentChain.id}`);
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (!this.publicClient) {
          this.initializeClient();
        }
        return await operation();
      } catch (error) {
        console.warn(`RPC call failed (attempt ${attempt + 1}/${maxRetries}):`, error);
        
        if (attempt < maxRetries - 1) {
          // Try next RPC endpoint
          this.currentRpcIndex = (this.currentRpcIndex + 1) % networkConfig.rpcUrls.length;
          this.initializeClient();
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        } else {
          throw error;
        }
      }
    }
    throw new Error('All retry attempts failed');
  }

  async getBalance(address: Address): Promise<string> {
    try {
      // Try the CORS-safe RPC method first
      const balanceHex = await this.makeRpcRequest('eth_getBalance', [address, 'latest']);
      const balance = BigInt(balanceHex);
      return formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw new Error(`Failed to fetch balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBalanceWithRetry(address: Address): Promise<{ balance: string; success: boolean; error?: string }> {
    try {
      const balance = await this.getBalance(address);
      return { balance, success: true };
    } catch (error) {
      return { 
        balance: '0.0', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async switchNetwork(chainId: number): Promise<boolean> {
    try {
      // Update current chain and reset RPC index
      this.currentChain = this.getChainById(chainId);
      this.currentRpcIndex = 0;

      // Initialize client with new network
      this.initializeClient();

      // Test the connection
      await this.retryWithFallback(async () => {
        if (!this.publicClient) {
          throw new Error('Public client not initialized');
        }
        return await this.publicClient.getChainId();
      });

      return true;
    } catch (error) {
      console.error('Failed to switch network:', error);
      return false;
    }
  }

  private getChainById(chainId: number): Chain {
    switch (chainId) {
      case 1: return mainnet;
      case 137: return polygon;
      case 56: return bsc;
      case 43114: return avalanche;
      case 42161: return arbitrum;
      case 10: return optimism;
      case 8453: return base;
      default: return mainnet;
    }
  }

  getCurrentChain(): Chain {
    return this.currentChain;
  }

  // Account management methods
  addAccount(account: Account): void {
    this.accounts.push(account);
    this.saveAccountsToStorage();
  }

  getAccounts(): Account[] {
    return this.accounts;
  }

  getCurrentAccount(): Account | null {
    if (!this.currentAccountId) return null;
    return this.accounts.find(acc => acc.id === this.currentAccountId) || null;
  }

  switchAccount(accountId: string): void {
    this.currentAccountId = accountId;
    localStorage.setItem('currentAccountId', accountId);
  }

  private saveAccountsToStorage(): void {
    localStorage.setItem('walletAccounts', JSON.stringify(this.accounts));
  }

  loadAccountsFromStorage(): void {
    const stored = localStorage.getItem('walletAccounts');
    if (stored) {
      this.accounts = JSON.parse(stored);
    }

    const currentId = localStorage.getItem('currentAccountId');
    if (currentId) {
      this.currentAccountId = currentId;
    }
  }

  // ERC-20 Token Operations
  async getTokenInfo(tokenAddress: Address): Promise<TokenInfo> {
    return await this.retryWithFallback(async () => {
      if (!this.publicClient) {
        throw new Error('Public client not initialized');
      }

      // Ensure proper address formatting
      let normalizedAddress: Address;
      try {
        normalizedAddress = getAddress(tokenAddress);
      } catch (error) {
        throw new Error(`Invalid token address: ${tokenAddress}`);
      }

      const [name, symbol, decimals] = await Promise.all([
        this.publicClient.readContract({
          address: normalizedAddress,
          abi: ERC20_ABI,
          functionName: 'name'
        }),
        this.publicClient.readContract({
          address: normalizedAddress,
          abi: ERC20_ABI,
          functionName: 'symbol'
        }),
        this.publicClient.readContract({
          address: normalizedAddress,
          abi: ERC20_ABI,
          functionName: 'decimals'
        })
      ]);

      return {
        address: normalizedAddress,
        name: name as string,
        symbol: symbol as string,
        decimals: decimals as number,
        chainId: this.currentChain.id
      };
    });
  }

  async getTokenBalance(tokenAddress: Address, walletAddress: Address): Promise<TokenBalance> {
    return await this.retryWithFallback(async () => {
      if (!this.publicClient) {
        throw new Error('Public client not initialized');
      }

      // Ensure proper address formatting
      let normalizedTokenAddress: Address;
      let normalizedWalletAddress: Address;
      try {
        normalizedTokenAddress = getAddress(tokenAddress);
        normalizedWalletAddress = getAddress(walletAddress);
      } catch (error) {
        throw new Error(`Invalid address format - Token: ${tokenAddress}, Wallet: ${walletAddress}`);
      }

      const [tokenInfo, balanceWei] = await Promise.all([
        this.getTokenInfo(normalizedTokenAddress),
        this.publicClient.readContract({
          address: normalizedTokenAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [normalizedWalletAddress]
        }) as Promise<bigint>
      ]);

      const formattedBalance = formatUnits(balanceWei, tokenInfo.decimals);

      // Get price information
      let priceUsd: number | undefined;
      let valueUsd: number | undefined;
      let change24h: number | undefined;

      try {
        const priceData = await priceService.getTokenPrice(tokenInfo.symbol, this.currentChain.id);
        if (priceData) {
          priceUsd = priceData.priceUsd;
          change24h = priceData.change24h;
          valueUsd = parseFloat(formattedBalance) * priceData.priceUsd;
        }
      } catch (error) {
        console.warn(`Failed to get price for ${tokenInfo.symbol}:`, error);
      }

      return {
        token: tokenInfo,
        balance: balanceWei.toString(),
        formattedBalance,
        balanceWei,
        priceUsd,
        valueUsd,
        change24h
      };
    });
  }

  async getMultipleTokenBalances(
    tokenAddresses: Address[], 
    walletAddress: Address
  ): Promise<TokenBalance[]> {
    const results = await Promise.allSettled(
      tokenAddresses.map(async (tokenAddress, index) => {
        try {
          return await this.getTokenBalance(tokenAddress, walletAddress);
        } catch (error) {
          console.error(`Failed to get balance for token ${tokenAddress}:`, error);
          throw error;
        }
      })
    );

    const successful = results
      .filter((result): result is PromiseFulfilledResult<TokenBalance> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);

    const failed = results.filter(result => result.status === 'rejected');
    if (failed.length > 0) {
      console.warn(`Failed to load ${failed.length} out of ${tokenAddresses.length} tokens`);
    }

    return successful;
  }

  // Network health check
  async checkNetworkHealth(): Promise<{ chainId: number; blockNumber: bigint; healthy: boolean }> {
    try {
      const result = await this.retryWithFallback(async () => {
        if (!this.publicClient) {
          throw new Error('Public client not initialized');
        }
        
        const [chainId, blockNumber] = await Promise.all([
          this.publicClient.getChainId(),
          this.publicClient.getBlockNumber()
        ]);
        
        return { chainId, blockNumber };
      });
      
      return { ...result, healthy: true };
    } catch (error) {
      console.error('Network health check failed:', error);
      return { 
        chainId: this.currentChain.id, 
        blockNumber: BigInt(0), 
        healthy: false 
      };
    }
  }

  // Transaction Operations
  async estimateGas(request: TransactionRequest): Promise<GasEstimate> {
    return await this.retryWithFallback(async () => {
      if (!this.publicClient) {
        throw new Error('Public client not initialized');
      }

      const gasLimit = await this.publicClient.estimateGas({
        to: request.to,
        value: request.value ? parseEther(request.value) : undefined,
        data: request.data
      });

      // Get gas price information
      const feeData = await this.publicClient.estimateFeesPerGas();
      
      let estimatedCost: string;
      
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        // EIP-1559 transaction
        const cost = gasLimit * feeData.maxFeePerGas;
        estimatedCost = formatEther(cost);
        
        return {
          gasLimit,
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
          estimatedCost
        };
      } else {
        // Legacy transaction
        const gasPrice = await this.publicClient.getGasPrice();
        const cost = gasLimit * gasPrice;
        estimatedCost = formatEther(cost);
        
        return {
          gasLimit,
          gasPrice,
          estimatedCost
        };
      }
    });
  }

  async sendTransaction(request: TransactionRequest): Promise<TransactionResult> {
    if (!this.walletClient || !this.currentAccount) {
      throw new Error('Wallet client not initialized. Please set an account first.');
    }

    try {
      const gasEstimate = await this.estimateGas(request);
      
      // Prepare transaction parameters based on gas pricing method
      const txParams: any = {
        account: this.currentAccount,
        chain: this.currentChain,
        to: request.to,
        value: request.value ? parseEther(request.value) : undefined,
        data: request.data,
        gas: request.gasLimit || gasEstimate.gasLimit
      };

      // Use either EIP-1559 or legacy gas pricing
      if (gasEstimate.maxFeePerGas && gasEstimate.maxPriorityFeePerGas) {
        txParams.maxFeePerGas = request.maxFeePerGas || gasEstimate.maxFeePerGas;
        txParams.maxPriorityFeePerGas = request.maxPriorityFeePerGas || gasEstimate.maxPriorityFeePerGas;
      } else {
        txParams.gasPrice = request.gasPrice || gasEstimate.gasPrice;
      }

      const hash = await this.walletClient.sendTransaction(txParams);

      // Wait for transaction receipt
      const receipt = await this.publicClient!.waitForTransactionReceipt({ 
        hash,
        timeout: 60000 // 60 seconds timeout
      });

      return {
        hash,
        success: receipt.status === 'success',
        receipt
      };
    } catch (error) {
      console.error('Transaction failed:', error);
      return {
        hash: '0x' as Hash,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendTokenTransfer(request: TokenTransferRequest): Promise<TransactionResult> {
    if (!this.walletClient || !this.currentAccount) {
      throw new Error('Wallet client not initialized. Please set an account first.');
    }

    try {
      // Get token info to determine decimals
      const tokenInfo = await this.getTokenInfo(request.tokenAddress);
      const amountWei = parseUnits(request.amount, tokenInfo.decimals);

      // Encode transfer function call
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [request.to, amountWei]
      });

      // Send transaction
      const hash = await this.walletClient.sendTransaction({
        account: this.currentAccount,
        chain: this.currentChain,
        to: request.tokenAddress,
        data,
        gas: BigInt(100000) // Standard gas limit for ERC-20 transfers
      });

      // Wait for transaction receipt
      const receipt = await this.publicClient!.waitForTransactionReceipt({ 
        hash,
        timeout: 60000
      });

      return {
        hash,
        success: receipt.status === 'success',
        receipt
      };
    } catch (error) {
      console.error('Token transfer failed:', error);
      return {
        hash: '0x' as Hash,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getTransactionStatus(hash: Hash): Promise<{ 
    status: 'pending' | 'success' | 'failed' | 'not_found';
    receipt?: any;
  }> {
    try {
      const receipt = await this.publicClient!.getTransactionReceipt({ hash });
      return {
        status: receipt.status === 'success' ? 'success' : 'failed',
        receipt
      };
    } catch (error) {
      // Check if transaction exists in mempool
      try {
        await this.publicClient!.getTransaction({ hash });
        return { status: 'pending' };
      } catch {
        return { status: 'not_found' };
      }
    }
  }

  // Custom network management
  getCustomNetworks(): Record<number, NetworkInfo> {
    const stored = localStorage.getItem('customNetworks');
    return stored ? JSON.parse(stored) : {};
  }

  addCustomNetwork(network: Omit<NetworkInfo, 'isCustom'> & { chainId: number }): void {
    const customNetworks = this.getCustomNetworks();
    customNetworks[network.chainId] = {
      ...network,
      isCustom: true
    };
    localStorage.setItem('customNetworks', JSON.stringify(customNetworks));
  }

  removeCustomNetwork(chainId: number): void {
    const customNetworks = this.getCustomNetworks();
    delete customNetworks[chainId];
    localStorage.setItem('customNetworks', JSON.stringify(customNetworks));
  }

  getAllNetworks(): Record<number, NetworkInfo> {
    const customNetworks = this.getCustomNetworks();
    return { ...NETWORKS, ...customNetworks };
  }

  // Get transaction history for an address
  async getTransactionHistory(address: Address, limit: number = 50): Promise<TransactionHistory[]> {
    try {
      // Get the latest block number using our CORS-safe RPC method
      const latestBlockResult = await this.makeRpcRequest('eth_blockNumber');
      const currentBlockNumber = parseInt(latestBlockResult, 16);
      
      // We'll scan the last 500 blocks to avoid too many requests
      const fromBlock = Math.max(0, currentBlockNumber - 500);
      
      const transactions: TransactionHistory[] = [];

      // Get transactions where this address is involved (sent or received)
      for (let blockNumber = currentBlockNumber; blockNumber >= fromBlock && transactions.length < limit; blockNumber--) {
        try {
          const blockHex = '0x' + blockNumber.toString(16);
          const block = await this.makeRpcRequest('eth_getBlockByNumber', [blockHex, true]);
          
          if (!block || !block.transactions) {
            console.warn(`Failed to get block ${blockNumber}`);
            continue;
          }

          for (const tx of block.transactions) {
            if (!tx || typeof tx === 'string') continue; // Skip if only hash is provided
            
            // Check if this transaction involves our address
            const isFromAddress = tx.from?.toLowerCase() === address.toLowerCase();
            const isToAddress = tx.to?.toLowerCase() === address.toLowerCase();
            
            if (!isFromAddress && !isToAddress) continue;

            // Get transaction receipt for status and gas info
            let receipt;
            try {
              receipt = await this.makeRpcRequest('eth_getTransactionReceipt', [tx.hash]);
            } catch (error) {
              console.warn('Failed to get receipt for', tx.hash);
              continue;
            }

            const transactionHistory: TransactionHistory = {
              hash: tx.hash,
              from: tx.from as Address,
              to: tx.to as Address,
              value: tx.value?.toString() || '0',
              formattedValue: formatEther(BigInt(tx.value || '0x0')),
              gasUsed: receipt?.gasUsed?.toString() || '0',
              gasPrice: tx.gasPrice?.toString() || '0',
              blockNumber: parseInt(block.number, 16),
              timestamp: parseInt(block.timestamp, 16),
              status: receipt?.status === '0x1' ? 'success' : 'failed',
              type: isFromAddress ? 'send' : 'receive',
              chainId: this.currentChain.id
            };

            // Check if this is a token transfer by looking at logs
            if (receipt.logs && receipt.logs.length > 0) {
              const tokenTransferLog = receipt.logs.find((log: any) => 
                log.topics?.[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // Transfer event
              );
              
              if (tokenTransferLog) {
                transactionHistory.type = 'contract';
                // You could decode the token info here if needed
              }
            }

            transactions.push(transactionHistory);
            
            if (transactions.length >= limit) break;
          }
        } catch (error) {
          console.warn(`Failed to get block ${blockNumber}:`, error);
          continue;
        }
      }

      // Sort by timestamp descending (newest first)
      return transactions.sort((a, b) => b.timestamp - a.timestamp);

    } catch (error) {
      console.error('Failed to get transaction history:', error);
      throw new Error('Failed to fetch transaction history');
    }
  }

  // Get native token balance with price
  async getNativeTokenBalance(address: Address): Promise<{ balance: string; priceUsd?: number; valueUsd?: number; change24h?: number }> {
    try {
      const balance = await this.getBalance(address);
      const networkConfig = NETWORKS[this.currentChain.id as keyof typeof NETWORKS];
      
      if (!networkConfig) {
        return { balance };
      }

      // Get price information for native token
      let priceUsd: number | undefined;
      let valueUsd: number | undefined;
      let change24h: number | undefined;

      try {
        const priceData = await priceService.getTokenPrice(networkConfig.symbol, this.currentChain.id);
        if (priceData) {
          priceUsd = priceData.priceUsd;
          change24h = priceData.change24h;
          valueUsd = parseFloat(balance) * priceData.priceUsd;
        }
      } catch (error) {
        console.warn(`Failed to get price for ${networkConfig.symbol}:`, error);
      }

      return {
        balance,
        priceUsd,
        valueUsd,
        change24h
      };
    } catch (error) {
      console.error('Failed to get native token balance:', error);
      throw error;
    }
  }

  // Get pending transactions for an address
  async getPendingTransactions(address: Address): Promise<TransactionHistory[]> {
    if (!this.publicClient) {
      throw new Error('Wallet service not initialized');
    }

    try {
      // This is a simplified implementation
      // In a real app, you might use mempool APIs or track pending transactions locally
      const pendingTxs: TransactionHistory[] = [];
      
      // You could store pending transaction hashes in localStorage
      // and check their status periodically
      const storedPending = localStorage.getItem(`pending_txs_${address}`);
      if (storedPending) {
        const pendingHashes = JSON.parse(storedPending);
        
        for (const hash of pendingHashes) {
          const status = await this.getTransactionStatus(hash as Hash);
          if (status.status === 'pending') {
            try {
              const tx = await this.publicClient.getTransaction({ hash });
              pendingTxs.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to || '0x0000000000000000000000000000000000000000' as Address,
                value: tx.value?.toString() || '0',
                formattedValue: formatEther(tx.value || 0n),
                gasUsed: '0',
                gasPrice: tx.gasPrice?.toString() || '0',
                blockNumber: 0,
                timestamp: Date.now() / 1000,
                status: 'pending',
                type: tx.from.toLowerCase() === address.toLowerCase() ? 'send' : 'receive',
                chainId: this.currentChain.id
              });
            } catch (error) {
              console.warn('Failed to get pending transaction:', error);
            }
          }
        }
      }
      
      return pendingTxs;
    } catch (error) {
      console.error('Failed to get pending transactions:', error);
      return [];
    }
  }
}

export const walletService = new WalletService();

// Common token addresses by network - properly checksummed
const createTokenInfo = (address: string, symbol: string, name: string, decimals: number, chainId: number): TokenInfo => ({
  address: getAddress(address),
  symbol,
  name,
  decimals,
  chainId
});

export const COMMON_TOKENS: Record<number, TokenInfo[]> = {
  1: [ // Ethereum mainnet - using verified addresses
    createTokenInfo('0xdAC17F958D2ee523a2206206994597C13D831ec7', 'USDT', 'Tether USD', 6, 1),
    createTokenInfo('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 'UNI', 'Uniswap', 18, 1)
  ],
  137: [ // Polygon
    createTokenInfo('0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', 'USDC', 'USD Coin', 6, 137),
    createTokenInfo('0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 'USDT', 'Tether USD', 6, 137)
  ],
  56: [ // BSC
    createTokenInfo('0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', 'USDC', 'USD Coin', 18, 56),
    createTokenInfo('0x55d398326f99059fF775485246999027B3197955', 'USDT', 'Tether USD', 18, 56)
  ]
};

// Utility functions
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function normalizeAddress(address: string): Address {
  try {
    return getAddress(address);
  } catch (error) {
    throw new Error(`Invalid address format: ${address}`);
  }
}

export function isValidAddress(address: string): boolean {
  try {
    // Use Viem's getAddress function for proper validation including checksum
    getAddress(address);
    return true;
  } catch {
    // Fall back to basic regex check for addresses that might not be checksummed
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

export function getCommonTokensForNetwork(chainId: number): TokenInfo[] {
  return COMMON_TOKENS[chainId] || [];
}