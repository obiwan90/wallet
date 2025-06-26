import { generatePrivateKey, privateKeyToAccount, mnemonicToAccount } from 'viem/accounts';
import { generateMnemonic, validateMnemonic, mnemonicToSeedSync } from 'bip39';
import { HDKey } from '@scure/bip32';
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

  // Generate a cryptographic key from password using PBKDF2
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const importedKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000, // 100k iterations for security
        hash: 'SHA-256'
      },
      importedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Generate cryptographically secure random bytes
  private generateRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  // Encrypt wallet data using AES-GCM with PBKDF2 key derivation
  async encryptWalletData(walletData: WalletData, password: string): Promise<string> {
    try {
      const salt = this.generateRandomBytes(16); // 128-bit salt
      const iv = this.generateRandomBytes(12); // 96-bit IV for GCM
      
      const key = await this.deriveKey(password, salt);
      
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(walletData));
      
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        data
      );

      // Combine salt + iv + encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt wallet data');
    }
  }

  // Decrypt wallet data using AES-GCM with PBKDF2 key derivation
  async decryptWalletData(encryptedData: string, password: string): Promise<WalletData> {
    try {
      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      // Extract salt, IV, and encrypted data
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const encrypted = combined.slice(28);

      const key = await this.deriveKey(password, salt);

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decryptedData);
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt wallet data - incorrect password or corrupted data');
    }
  }

  // Legacy decryption for backwards compatibility
  private legacyDecrypt(encryptedData: string, password: string): WalletData {
    try {
      const decoded = atob(encryptedData);
      const data = decoded.slice(0, -password.length);
      return JSON.parse(data);
    } catch {
      throw new Error('Failed to decrypt wallet data - incorrect password');
    }
  }

  // Attempt decryption with both new and legacy methods
  async decryptWalletDataWithFallback(encryptedData: string, password: string): Promise<WalletData> {
    try {
      // Try new encryption method first
      return await this.decryptWalletData(encryptedData, password);
    } catch (error) {
      try {
        // Fallback to legacy method for backwards compatibility
        console.warn('Falling back to legacy decryption method');
        return this.legacyDecrypt(encryptedData, password);
      } catch (legacyError) {
        throw new Error('Failed to decrypt wallet data - incorrect password or corrupted data');
      }
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
  async saveWalletToStorage(walletData: WalletData, password: string): Promise<void> {
    if (!password) {
      throw new Error('Password is required');
    }

    const encrypted = await this.encryptWalletData(walletData, password);
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

  // Decrypt stored wallet data
  async decryptStoredWallet(accountId: string, password: string): Promise<WalletData> {
    const accounts = this.getStoredAccounts();
    const account = accounts.find(acc => acc.id === accountId);
    
    if (!account || !account.encrypted) {
      throw new Error('Wallet not found');
    }

    return await this.decryptWalletDataWithFallback(account.encrypted, password);
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

  // Securely derive private key for transaction signing
  async getPrivateKeyForSigning(accountId: string, password: string): Promise<`0x${string}`> {
    const walletData = await this.decryptStoredWallet(accountId, password);
    
    if (walletData.privateKey) {
      // Direct private key import
      return walletData.privateKey as `0x${string}`;
    } else if (walletData.mnemonic) {
      // Derive private key from mnemonic using BIP44 path
      const seed = mnemonicToSeedSync(walletData.mnemonic);
      const hdKey = HDKey.fromMasterSeed(seed);
      // Use BIP44 path for Ethereum: m/44'/60'/0'/0/0
      const accountKey = hdKey.derive("m/44'/60'/0'/0/0");
      if (!accountKey.privateKey) {
        throw new Error('Failed to derive private key from mnemonic');
      }
      return `0x${Buffer.from(accountKey.privateKey).toString('hex')}` as `0x${string}`;
    } else {
      throw new Error('No private key or mnemonic found');
    }
  }

  // Validate wallet password without exposing sensitive data
  async validateWalletPassword(accountId: string, password: string): Promise<boolean> {
    try {
      await this.decryptStoredWallet(accountId, password);
      return true;
    } catch {
      return false;
    }
  }

  // Upgrade wallet encryption (migrate from legacy to new encryption)
  async upgradeWalletEncryption(accountId: string, password: string): Promise<boolean> {
    try {
      const accounts = this.getStoredAccounts();
      const accountIndex = accounts.findIndex(acc => acc.id === accountId);
      
      if (accountIndex === -1) {
        throw new Error('Account not found');
      }

      // Decrypt with fallback method
      const walletData = await this.decryptWalletDataWithFallback(accounts[accountIndex].encrypted!, password);
      
      // Re-encrypt with new method
      const newEncrypted = await this.encryptWalletData(walletData, password);
      
      // Update storage
      accounts[accountIndex].encrypted = newEncrypted;
      localStorage.setItem('walletAccounts', JSON.stringify(accounts));
      
      console.log('Wallet encryption upgraded successfully');
      return true;
    } catch (error) {
      console.error('Failed to upgrade wallet encryption:', error);
      return false;
    }
  }
}

export const walletManager = WalletManager.getInstance();