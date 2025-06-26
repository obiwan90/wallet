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
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { mainnet, polygon, bsc, avalanche, arbitrum, optimism, base } from 'viem/chains';

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

// Network configurations with multiple RPC endpoints for redundancy
export const NETWORKS = {
  1: { 
    name: 'Ethereum', 
    symbol: 'ETH', 
    chain: mainnet, 
    color: '#627EEA', 
    rpcUrls: [
      'https://eth.llamarpc.com',
      'https://ethereum.publicnode.com',
      'https://rpc.ankr.com/eth'
    ]
  },
  137: { 
    name: 'Polygon', 
    symbol: 'MATIC', 
    chain: polygon, 
    color: '#8247E5', 
    rpcUrls: [
      'https://polygon.llamarpc.com',
      'https://polygon-rpc.com',
      'https://rpc.ankr.com/polygon'
    ]
  },
  56: { 
    name: 'BSC', 
    symbol: 'BNB', 
    chain: bsc, 
    color: '#F3BA2F', 
    rpcUrls: [
      'https://binance.llamarpc.com',
      'https://bsc-dataseed.binance.org',
      'https://rpc.ankr.com/bsc'
    ]
  },
  43114: { 
    name: 'Avalanche', 
    symbol: 'AVAX', 
    chain: avalanche, 
    color: '#E84142', 
    rpcUrls: [
      'https://avalanche.drpc.org',
      'https://api.avax.network/ext/bc/C/rpc',
      'https://rpc.ankr.com/avalanche'
    ]
  },
  42161: { 
    name: 'Arbitrum', 
    symbol: 'ETH', 
    chain: arbitrum, 
    color: '#28A0F0', 
    rpcUrls: [
      'https://arbitrum.llamarpc.com',
      'https://arb1.arbitrum.io/rpc',
      'https://rpc.ankr.com/arbitrum'
    ]
  },
  10: { 
    name: 'Optimism', 
    symbol: 'ETH', 
    chain: optimism, 
    color: '#FF0420', 
    rpcUrls: [
      'https://optimism.llamarpc.com',
      'https://mainnet.optimism.io',
      'https://rpc.ankr.com/optimism'
    ]
  },
  8453: { 
    name: 'Base', 
    symbol: 'ETH', 
    chain: base, 
    color: '#0052FF', 
    rpcUrls: [
      'https://base.llamarpc.com',
      'https://mainnet.base.org',
      'https://rpc.ankr.com/base'
    ]
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
      const balance = await this.retryWithFallback(async () => {
        if (!this.publicClient) {
          throw new Error('Public client not initialized');
        }
        return await this.publicClient.getBalance({ address });
      });
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

      const [name, symbol, decimals] = await Promise.all([
        this.publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'name'
        }),
        this.publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'symbol'
        }),
        this.publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'decimals'
        })
      ]);

      return {
        address: tokenAddress,
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

      const [tokenInfo, balanceWei] = await Promise.all([
        this.getTokenInfo(tokenAddress),
        this.publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [walletAddress]
        }) as Promise<bigint>
      ]);

      const formattedBalance = formatUnits(balanceWei, tokenInfo.decimals);

      return {
        token: tokenInfo,
        balance: balanceWei.toString(),
        formattedBalance,
        balanceWei
      };
    });
  }

  async getMultipleTokenBalances(
    tokenAddresses: Address[], 
    walletAddress: Address
  ): Promise<TokenBalance[]> {
    const results = await Promise.allSettled(
      tokenAddresses.map(tokenAddress => 
        this.getTokenBalance(tokenAddress, walletAddress)
      )
    );

    return results
      .filter((result): result is PromiseFulfilledResult<TokenBalance> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
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
}

export const walletService = new WalletService();

// Common token addresses by network
export const COMMON_TOKENS: Record<number, TokenInfo[]> = {
  1: [ // Ethereum mainnet
    {
      address: '0xA0b86a33E6441cc2bbC9dd1c6A8beD47aA00E5e4',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 1
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 1
    },
    {
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      symbol: 'UNI',
      name: 'Uniswap',
      decimals: 18,
      chainId: 1
    }
  ],
  137: [ // Polygon
    {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 137
    },
    {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 137
    }
  ],
  56: [ // BSC
    {
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 18,
      chainId: 56
    },
    {
      address: '0x55d398326f99059fF775485246999027B3197955',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 18,
      chainId: 56
    }
  ]
};

// Utility functions
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function getCommonTokensForNetwork(chainId: number): TokenInfo[] {
  return COMMON_TOKENS[chainId] || [];
}