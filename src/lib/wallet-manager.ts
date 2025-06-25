import { generatePrivateKey, privateKeyToAccount, mnemonicToAccount } from 'viem/accounts';
import { generateMnemonic, validateMnemonic } from 'bip39';
import { type Address } from 'viem';
import { Account } from './web3';

export interface WalletData {
  mnemonic?: string;
  privateKey?: string;
  address: Address;
  name: string;
}

export class WalletManager {
  private static instance: WalletManager;
  private password: string | null = null;

  static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  // Generate a new wallet with mnemonic
  generateWallet(name: string = 'Account 1'): WalletData {
    const mnemonic = generateMnemonic();
    const account = mnemonicToAccount(mnemonic);

    return {
      mnemonic,
      address: account.address,
      name
    };
  }

  // Import wallet from mnemonic
  importFromMnemonic(mnemonic: string, name: string = 'Imported Account'): WalletData {
    if (!validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    const account = mnemonicToAccount(mnemonic);

    return {
      mnemonic,
      address: account.address,
      name
    };
  }

  // Import wallet from private key
  importFromPrivateKey(privateKey: string, name: string = 'Imported Account'): WalletData {
    try {
      const account = privateKeyToAccount(privateKey as `0x${string}`);

      return {
        privateKey,
        address: account.address,
        name
      };
    } catch {
      throw new Error('Invalid private key');
    }
  }

  // Generate a new account from existing mnemonic (for multi-account support)
  generateAccountFromMnemonic(mnemonic: string, accountIndex: number = 0): WalletData {
    if (!validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    // For simplicity, we'll use the same mnemonic but with different derivation paths
    // In a real implementation, you'd use proper BIP44 derivation
    const account = mnemonicToAccount(mnemonic, { addressIndex: accountIndex });

    return {
      mnemonic,
      address: account.address,
      name: `Account ${accountIndex + 1}`
    };
  }

  // Encrypt wallet data (simplified - in production use proper encryption)
  encryptWalletData(walletData: WalletData, password: string): string {
    // This is a simplified encryption - in production, use proper cryptographic libraries
    const data = JSON.stringify(walletData);
    return btoa(data + password); // Base64 encoding with password (NOT secure for production)
  }

  // Decrypt wallet data (simplified - in production use proper decryption)
  decryptWalletData(encryptedData: string, password: string): WalletData {
    try {
      // This is a simplified decryption - in production, use proper cryptographic libraries
      const decoded = atob(encryptedData);
      const data = decoded.slice(0, -password.length);
      return JSON.parse(data);
    } catch {
      throw new Error('Failed to decrypt wallet data - incorrect password');
    }
  }

  // Set password for encryption
  setPassword(password: string): void {
    this.password = password;
  }

  // Validate password
  validatePassword(password: string): boolean {
    return this.password === password;
  }

  // Save encrypted wallet to local storage
  saveWalletToStorage(walletData: WalletData, password: string): void {
    if (!password) {
      throw new Error('Password is required');
    }

    const encrypted = this.encryptWalletData(walletData, password);
    const accounts = this.getStoredAccounts();

    const account: Account = {
      id: Date.now().toString(),
      name: walletData.name,
      address: walletData.address,
      type: walletData.mnemonic ? 'generated' : 'imported',
      encrypted
    };

    accounts.push(account);
    localStorage.setItem('walletAccounts', JSON.stringify(accounts));
  }

  // Load encrypted wallets from local storage
  getStoredAccounts(): Account[] {
    const stored = localStorage.getItem('walletAccounts');
    return stored ? JSON.parse(stored) : [];
  }

  // Remove wallet from storage
  removeWalletFromStorage(accountId: string): void {
    const accounts = this.getStoredAccounts();
    const filtered = accounts.filter(acc => acc.id !== accountId);
    localStorage.setItem('walletAccounts', JSON.stringify(filtered));
  }

  // Clear all wallets (for reset functionality)
  clearAllWallets(): void {
    localStorage.removeItem('walletAccounts');
    localStorage.removeItem('currentAccountId');
    this.password = null;
  }

  // Generate a random private key
  generateRandomPrivateKey(): string {
    return generatePrivateKey();
  }

  // Validate Ethereum address
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Get wallet balance using a public RPC
  async getWalletBalance(): Promise<string> {
    try {
      // This would typically use your viem public client
      // For now, return a placeholder
      return '0.0';
    } catch (error) {
      return '0.0';
    }
  }
}

export const walletManager = WalletManager.getInstance();