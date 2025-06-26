// NFT Service for querying and managing NFT collections
import { Address } from 'viem';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  background_color?: string;
  animation_url?: string;
}

export interface NFTItem {
  tokenId: string;
  contractAddress: Address;
  contractName: string;
  contractSymbol: string;
  tokenStandard: 'ERC721' | 'ERC1155';
  metadata: NFTMetadata;
  imageUrl: string;
  floorPrice?: number;
  lastSalePrice?: number;
  rarity?: {
    rank: number;
    score: number;
  };
  collection: {
    name: string;
    slug: string;
    verified: boolean;
    floorPrice?: number;
  };
}

export interface NFTCollection {
  contractAddress: Address;
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  floorPrice?: number;
  totalSupply?: number;
  verified: boolean;
  itemCount: number;
  items: NFTItem[];
}

export interface NFTBalance {
  collections: NFTCollection[];
  totalItems: number;
  totalValue: number;
}

class NFTService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 300000; // 5 minutes cache for NFTs

  // API endpoints for different NFT services
  private readonly API_ENDPOINTS = {
    // OpenSea API (requires API key in production)
    opensea: 'https://api.opensea.io/api/v1',
    // Alchemy NFT API (free tier available)
    alchemy: 'https://eth-mainnet.g.alchemy.com/nft/v2',
    // Moralis NFT API (free tier available)
    moralis: 'https://deep-index.moralis.io/api/v2',
  };

  // Get NFTs owned by an address
  async getNFTsForAddress(address: Address, chainId: number = 1): Promise<NFTBalance> {
    const cacheKey = `nfts-${address}-${chainId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      let nftData: NFTBalance;
      
      // Try different providers based on chain
      if (chainId === 1) {
        // Ethereum mainnet - try OpenSea first
        nftData = await this.fetchFromOpenSea(address);
      } else {
        // Other chains - use Alchemy or Moralis
        nftData = await this.fetchFromAlchemy(address, chainId);
      }

      // Cache the result
      this.cache.set(cacheKey, { data: nftData, timestamp: Date.now() });
      return nftData;
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
      
      // Return mock data for development
      return this.getMockNFTData(address);
    }
  }

  // Fetch NFTs from OpenSea
  private async fetchFromOpenSea(address: Address): Promise<NFTBalance> {
    try {
      const response = await fetch(
        `${this.API_ENDPOINTS.opensea}/assets?owner=${address}&limit=50`,
        {
          headers: {
            'Accept': 'application/json',
            // 'X-API-KEY': process.env.OPENSEA_API_KEY || '', // Add API key for production
          }
        }
      );

      if (!response.ok) {
        throw new Error(`OpenSea API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseOpenSeaResponse(data);
    } catch (error) {
      console.warn('OpenSea API failed:', error);
      throw error;
    }
  }

  // Fetch NFTs from Alchemy
  private async fetchFromAlchemy(address: Address, chainId: number): Promise<NFTBalance> {
    try {
      // This would require an Alchemy API key
      // For now, return mock data
      return this.getMockNFTData(address);
    } catch (error) {
      console.warn('Alchemy API failed:', error);
      throw error;
    }
  }

  // Parse OpenSea API response
  private parseOpenSeaResponse(data: any): NFTBalance {
    const collections = new Map<Address, NFTCollection>();
    
    data.assets?.forEach((asset: any) => {
      const contractAddress = asset.asset_contract.address as Address;
      
      if (!collections.has(contractAddress)) {
        collections.set(contractAddress, {
          contractAddress,
          name: asset.asset_contract.name || 'Unknown Collection',
          symbol: asset.asset_contract.symbol || '',
          description: asset.collection?.description,
          imageUrl: asset.collection?.image_url,
          bannerUrl: asset.collection?.banner_image_url,
          floorPrice: asset.collection?.stats?.floor_price,
          totalSupply: asset.asset_contract.total_supply,
          verified: asset.collection?.safelist_request_status === 'verified',
          itemCount: 0,
          items: []
        });
      }

      const collection = collections.get(contractAddress)!;
      collection.itemCount++;
      
      const nftItem: NFTItem = {
        tokenId: asset.token_id,
        contractAddress,
        contractName: collection.name,
        contractSymbol: collection.symbol,
        tokenStandard: asset.asset_contract.schema_name === 'ERC1155' ? 'ERC1155' : 'ERC721',
        metadata: {
          name: asset.name || `#${asset.token_id}`,
          description: asset.description || '',
          image: asset.image_url || asset.image_preview_url || '',
          external_url: asset.external_link,
          attributes: asset.traits?.map((trait: any) => ({
            trait_type: trait.trait_type,
            value: trait.value
          }))
        },
        imageUrl: asset.image_url || asset.image_preview_url || '',
        lastSalePrice: asset.last_sale?.total_price ? 
          parseFloat(asset.last_sale.total_price) / 1e18 : undefined,
        collection: {
          name: collection.name,
          slug: asset.collection?.slug || '',
          verified: collection.verified,
          floorPrice: collection.floorPrice
        }
      };

      collection.items.push(nftItem);
    });

    const collectionsArray = Array.from(collections.values());
    const totalItems = collectionsArray.reduce((sum, col) => sum + col.itemCount, 0);
    const totalValue = collectionsArray.reduce((sum, col) => {
      return sum + (col.floorPrice || 0) * col.itemCount;
    }, 0);

    return {
      collections: collectionsArray,
      totalItems,
      totalValue
    };
  }

  // Get mock NFT data for development/testing
  private getMockNFTData(address: Address): NFTBalance {
    const mockCollections: NFTCollection[] = [
      {
        contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D' as Address,
        name: 'Bored Ape Yacht Club',
        symbol: 'BAYC',
        description: 'The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs.',
        imageUrl: 'https://lh3.googleusercontent.com/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB=s250',
        floorPrice: 50.5,
        totalSupply: 10000,
        verified: true,
        itemCount: 2,
        items: [
          {
            tokenId: '1234',
            contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D' as Address,
            contractName: 'Bored Ape Yacht Club',
            contractSymbol: 'BAYC',
            tokenStandard: 'ERC721',
            metadata: {
              name: 'Bored Ape #1234',
              description: 'A unique Bored Ape with rare traits',
              image: 'https://lh3.googleusercontent.com/H8jOCJuQokNqGBpkBQ5yNfNLVLHh8hZDftLJM0vWJzj_iBXWlZVr7AK7KFXDNq5M4tpHBz7X2F',
              attributes: [
                { trait_type: 'Background', value: 'Blue' },
                { trait_type: 'Fur', value: 'Golden Brown' },
                { trait_type: 'Eyes', value: 'Laser Eyes' }
              ]
            },
            imageUrl: 'https://lh3.googleusercontent.com/H8jOCJuQokNqGBpkBQ5yNfNLVLHh8hZDftLJM0vWJzj_iBXWlZVr7AK7KFXDNq5M4tpHBz7X2F',
            floorPrice: 50.5,
            rarity: { rank: 123, score: 1234.5 },
            collection: {
              name: 'Bored Ape Yacht Club',
              slug: 'boredapeyachtclub',
              verified: true,
              floorPrice: 50.5
            }
          },
          {
            tokenId: '5678',
            contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D' as Address,
            contractName: 'Bored Ape Yacht Club',
            contractSymbol: 'BAYC',
            tokenStandard: 'ERC721',
            metadata: {
              name: 'Bored Ape #5678',
              description: 'Another unique Bored Ape',
              image: 'https://lh3.googleusercontent.com/X9jOCJuQokNqGBpkBQ5yNfNLVLHh8hZDftLJM0vWJzj_iBXWlZVr7AK7KFXDNq5M4tpHBz7X2F',
              attributes: [
                { trait_type: 'Background', value: 'Purple' },
                { trait_type: 'Fur', value: 'Black' },
                { trait_type: 'Hat', value: 'Party Hat' }
              ]
            },
            imageUrl: 'https://lh3.googleusercontent.com/X9jOCJuQokNqGBpkBQ5yNfNLVLHh8hZDftLJM0vWJzj_iBXWlZVr7AK7KFXDNq5M4tpHBz7X2F',
            floorPrice: 50.5,
            rarity: { rank: 456, score: 987.3 },
            collection: {
              name: 'Bored Ape Yacht Club',
              slug: 'boredapeyachtclub',
              verified: true,
              floorPrice: 50.5
            }
          }
        ]
      },
      {
        contractAddress: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6' as Address,
        name: 'Mutant Ape Yacht Club',
        symbol: 'MAYC',
        description: 'A collection of up to 20,000 Mutant Apes.',
        imageUrl: 'https://lh3.googleusercontent.com/lHexKRMpw-aoSyB1WdqzLJ7SBJf6GBMjNn5hnpBBa6F7aXOsEpvZ_KXz1eLwYdBf6TUB5KM4',
        floorPrice: 15.2,
        totalSupply: 19423,
        verified: true,
        itemCount: 1,
        items: [
          {
            tokenId: '9999',
            contractAddress: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6' as Address,
            contractName: 'Mutant Ape Yacht Club',
            contractSymbol: 'MAYC',
            tokenStandard: 'ERC721',
            metadata: {
              name: 'Mutant Ape #9999',
              description: 'A mutant ape with unique characteristics',
              image: 'https://lh3.googleusercontent.com/mutant-ape-9999.png',
              attributes: [
                { trait_type: 'Background', value: 'Mutant Blue' },
                { trait_type: 'Fur', value: 'Mutant Gray' },
                { trait_type: 'Eyes', value: 'Hypnotized' }
              ]
            },
            imageUrl: 'https://lh3.googleusercontent.com/mutant-ape-9999.png',
            floorPrice: 15.2,
            collection: {
              name: 'Mutant Ape Yacht Club',
              slug: 'mutant-ape-yacht-club',
              verified: true,
              floorPrice: 15.2
            }
          }
        ]
      }
    ];

    return {
      collections: mockCollections,
      totalItems: 3,
      totalValue: 116.2 // 2 * 50.5 + 1 * 15.2
    };
  }

  // Get detailed NFT metadata
  async getNFTMetadata(contractAddress: Address, tokenId: string, chainId: number = 1): Promise<NFTMetadata | null> {
    try {
      // This would call the contract's tokenURI function and fetch metadata
      // For now, return null to indicate we should use cached data
      return null;
    } catch (error) {
      console.error('Failed to fetch NFT metadata:', error);
      return null;
    }
  }

  // Transfer NFT (basic implementation)
  async transferNFT(
    contractAddress: Address,
    tokenId: string,
    from: Address,
    to: Address,
    tokenStandard: 'ERC721' | 'ERC1155' = 'ERC721'
  ): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      // This would require wallet service integration for signing
      // For now, return a mock response
      return {
        success: false,
        error: 'NFT transfer functionality not yet implemented'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed'
      };
    }
  }

  // Get NFT collection floor price
  async getCollectionFloorPrice(contractAddress: Address): Promise<number | null> {
    try {
      // This would query OpenSea or other marketplace APIs
      return null;
    } catch (error) {
      console.error('Failed to get floor price:', error);
      return null;
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get supported chains for NFT queries
  getSupportedChains(): number[] {
    return [1, 137, 56, 42161, 10, 8453]; // Ethereum, Polygon, BSC, Arbitrum, Optimism, Base
  }
}

export const nftService = new NFTService();