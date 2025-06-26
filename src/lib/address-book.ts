// Address book service for managing frequently used addresses
import { Address } from 'viem';

export interface AddressBookEntry {
  id: string;
  name: string;
  address: Address;
  description?: string;
  category: 'personal' | 'business' | 'defi' | 'other';
  chainId?: number; // Optional: specific to a chain
  avatar?: string; // Optional: custom avatar or generated from address
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
  tags?: string[];
}

export interface AddressBookFilter {
  category?: AddressBookEntry['category'];
  chainId?: number;
  isFavorite?: boolean;
  searchTerm?: string;
}

class AddressBookService {
  private readonly STORAGE_KEY = 'wallet_address_book';
  private entries: AddressBookEntry[] = [];

  constructor() {
    // Only load from storage on client side
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  // Load address book from localStorage
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.entries = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load address book from storage:', error);
      this.entries = [];
    }
  }

  // Save address book to localStorage
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.entries));
    } catch (error) {
      console.error('Failed to save address book to storage:', error);
    }
  }

  // Add a new address entry
  addAddress(entry: Omit<AddressBookEntry, 'id' | 'createdAt' | 'updatedAt'>): AddressBookEntry {
    // Check if address already exists
    const existingEntry = this.entries.find(e => 
      e.address.toLowerCase() === entry.address.toLowerCase() && 
      e.chainId === entry.chainId
    );

    if (existingEntry) {
      throw new Error('Address already exists in address book');
    }

    const now = Date.now();
    const newEntry: AddressBookEntry = {
      ...entry,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };

    this.entries.push(newEntry);
    this.saveToStorage();
    
    return newEntry;
  }

  // Update an existing address entry
  updateAddress(id: string, updates: Partial<Omit<AddressBookEntry, 'id' | 'createdAt' | 'updatedAt'>>): AddressBookEntry {
    const index = this.entries.findIndex(entry => entry.id === id);
    
    if (index === -1) {
      throw new Error('Address entry not found');
    }

    // If updating address, check for duplicates
    if (updates.address) {
      const existingEntry = this.entries.find((e, i) => 
        i !== index &&
        e.address.toLowerCase() === updates.address!.toLowerCase() && 
        e.chainId === (updates.chainId || this.entries[index].chainId)
      );

      if (existingEntry) {
        throw new Error('Address already exists in address book');
      }
    }

    this.entries[index] = {
      ...this.entries[index],
      ...updates,
      updatedAt: Date.now(),
    };

    this.saveToStorage();
    return this.entries[index];
  }

  // Delete an address entry
  deleteAddress(id: string): boolean {
    const index = this.entries.findIndex(entry => entry.id === id);
    
    if (index === -1) {
      return false;
    }

    this.entries.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // Get all addresses with optional filtering
  getAddresses(filter?: AddressBookFilter): AddressBookEntry[] {
    let filtered = [...this.entries];

    if (filter) {
      if (filter.category) {
        filtered = filtered.filter(entry => entry.category === filter.category);
      }

      if (filter.chainId !== undefined) {
        filtered = filtered.filter(entry => 
          entry.chainId === filter.chainId || entry.chainId === undefined
        );
      }

      if (filter.isFavorite !== undefined) {
        filtered = filtered.filter(entry => !!entry.isFavorite === filter.isFavorite);
      }

      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        filtered = filtered.filter(entry =>
          entry.name.toLowerCase().includes(searchLower) ||
          entry.address.toLowerCase().includes(searchLower) ||
          entry.description?.toLowerCase().includes(searchLower) ||
          entry.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
    }

    // Sort by favorites first, then by updated time
    return filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }

  // Get a specific address entry by ID
  getAddress(id: string): AddressBookEntry | null {
    return this.entries.find(entry => entry.id === id) || null;
  }

  // Find address entry by address
  findByAddress(address: Address, chainId?: number): AddressBookEntry | null {
    return this.entries.find(entry => 
      entry.address.toLowerCase() === address.toLowerCase() &&
      (chainId === undefined || entry.chainId === chainId || entry.chainId === undefined)
    ) || null;
  }

  // Toggle favorite status
  toggleFavorite(id: string): boolean {
    const entry = this.entries.find(e => e.id === id);
    if (!entry) return false;

    entry.isFavorite = !entry.isFavorite;
    entry.updatedAt = Date.now();
    this.saveToStorage();
    
    return true;
  }

  // Get recent addresses (based on usage)
  getRecentAddresses(limit: number = 5): AddressBookEntry[] {
    return this.entries
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);
  }

  // Get favorite addresses
  getFavoriteAddresses(): AddressBookEntry[] {
    return this.entries
      .filter(entry => entry.isFavorite)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  // Get categories in use
  getCategories(): AddressBookEntry['category'][] {
    const categories = new Set(this.entries.map(entry => entry.category));
    return Array.from(categories);
  }

  // Get all tags in use
  getAllTags(): string[] {
    const tags = new Set<string>();
    this.entries.forEach(entry => {
      entry.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  // Import addresses from JSON
  importAddresses(data: AddressBookEntry[]): { success: number; errors: string[] } {
    let success = 0;
    const errors: string[] = [];

    data.forEach((entry, index) => {
      try {
        // Validate required fields
        if (!entry.name || !entry.address || !entry.category) {
          throw new Error('Missing required fields');
        }

        // Check for duplicates
        const existing = this.findByAddress(entry.address as Address, entry.chainId);
        if (existing) {
          throw new Error('Address already exists');
        }

        this.addAddress({
          name: entry.name,
          address: entry.address,
          category: entry.category,
          description: entry.description,
          chainId: entry.chainId,
          avatar: entry.avatar,
          isFavorite: entry.isFavorite,
          tags: entry.tags,
        });

        success++;
      } catch (error) {
        errors.push(`Entry ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    return { success, errors };
  }

  // Export addresses to JSON
  exportAddresses(): AddressBookEntry[] {
    return [...this.entries];
  }

  // Clear all addresses
  clearAll(): void {
    this.entries = [];
    this.saveToStorage();
  }

  // Get statistics
  getStats(): {
    total: number;
    favorites: number;
    categories: Record<string, number>;
    chains: Record<number, number>;
  } {
    const categories: Record<string, number> = {};
    const chains: Record<number, number> = {};
    let favorites = 0;

    this.entries.forEach(entry => {
      if (entry.isFavorite) favorites++;
      
      categories[entry.category] = (categories[entry.category] || 0) + 1;
      
      if (entry.chainId !== undefined) {
        chains[entry.chainId] = (chains[entry.chainId] || 0) + 1;
      }
    });

    return {
      total: this.entries.length,
      favorites,
      categories,
      chains,
    };
  }

  // Generate unique ID
  private generateId(): string {
    return `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const addressBookService = new AddressBookService();

// Utility functions
export function formatAddressName(entry: AddressBookEntry): string {
  return entry.name || `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`;
}

export function getCategoryIcon(category: AddressBookEntry['category']): string {
  switch (category) {
    case 'personal': return '👤';
    case 'business': return '🏢';
    case 'defi': return '💰';
    case 'other': return '📝';
    default: return '📝';
  }
}

export function getCategoryColor(category: AddressBookEntry['category']): string {
  switch (category) {
    case 'personal': return 'blue';
    case 'business': return 'green';
    case 'defi': return 'purple';
    case 'other': return 'gray';
    default: return 'gray';
  }
}

export function generateAvatar(address: Address): string {
  // Simple avatar generation based on address
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  const index = parseInt(address.slice(2, 4), 16) % colors.length;
  return colors[index];
}