import {
  createPublicClient,
  http,
  formatEther,
  parseEther,
  getAddress,
  type PublicClient,
  type Address,
  type Chain
} from 'viem';
import { mainnet, polygon, bsc, avalanche } from 'viem/chains';

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

export class WalletService {
  private publicClient: PublicClient | null = null;
  private currentChain: Chain = mainnet;
  private accounts: Account[] = [];
  private currentAccountId: string | null = null;

  constructor() {
    this.publicClient = createPublicClient({
      chain: this.currentChain,
      transport: http()
    });
  }

  async getBalance(address: Address): Promise<string> {
    if (!this.publicClient) {
      this.publicClient = createPublicClient({
        chain: this.currentChain,
        transport: http()
      });
    }

    const balance = await this.publicClient.getBalance({ address });
    return formatEther(balance);
  }

  async switchNetwork(chainId: number): Promise<boolean> {
    try {
      // Update current chain and clients
      this.currentChain = this.getChainById(chainId);

      this.publicClient = createPublicClient({
        chain: this.currentChain,
        transport: http()
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
}

export const walletService = new WalletService();

// Network configurations
export const NETWORKS = {
  1: { name: 'Ethereum Mainnet', symbol: 'ETH', chain: mainnet },
  137: { name: 'Polygon', symbol: 'MATIC', chain: polygon },
  56: { name: 'BSC', symbol: 'BNB', chain: bsc },
  43114: { name: 'Avalanche', symbol: 'AVAX', chain: avalanche }
};

// Utility functions
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}