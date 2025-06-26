"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Star,
  Verified,
  Grid3X3,
  List,
  Search,
  Filter,
  TrendingUp,
  Eye,
  Send,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { nftService, NFTItem, NFTCollection, NFTBalance } from '@/lib/nft-service';
import { formatPrice } from '@/lib/price-service';
import { useWeb3 } from '@/contexts/Web3Context';

interface NFTCardProps {
  nft: NFTItem;
  viewMode: 'grid' | 'list';
  onClick: () => void;
}

function NFTCard({ nft, viewMode, onClick }: NFTCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageLoad = () => setImageLoading(false);
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
        whileHover={{ scale: 1.01 }}
        onClick={onClick}
      >
        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {imageError ? (
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          ) : (
            <img
              src={nft.imageUrl}
              alt={nft.metadata.name}
              className="w-full h-full object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{nft.metadata.name}</h3>
            {nft.collection.verified && (
              <Verified className="w-4 h-4 text-blue-500" />
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{nft.contractName}</p>
        </div>

        <div className="text-right">
          {nft.floorPrice && (
            <div className="font-semibold">{formatPrice(nft.floorPrice)}</div>
          )}
          <div className="text-sm text-muted-foreground">#{nft.tokenId}</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="group cursor-pointer"
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-square relative bg-muted">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
          
          {imageError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
          ) : (
            <img
              src={nft.imageUrl}
              alt={nft.metadata.name}
              className={cn(
                "w-full h-full object-cover transition-opacity",
                imageLoading ? "opacity-0" : "opacity-100"
              )}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" className="backdrop-blur-sm">
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button size="sm" variant="secondary" className="backdrop-blur-sm">
              <Send className="w-4 h-4 mr-1" />
              Send
            </Button>
          </div>
        </div>

        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h3 className="font-semibold truncate text-sm">{nft.metadata.name}</h3>
                {nft.collection.verified && (
                  <Verified className="w-3 h-3 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{nft.contractName}</p>
            </div>
            
            <div className="text-right flex-shrink-0">
              {nft.floorPrice && (
                <div className="font-semibold text-sm">{formatPrice(nft.floorPrice)}</div>
              )}
              {nft.rarity && (
                <div className="text-xs text-muted-foreground">#{nft.rarity.rank}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface CollectionHeaderProps {
  collection: NFTCollection;
  isExpanded: boolean;
  onToggle: () => void;
}

function CollectionHeader({ collection, isExpanded, onToggle }: CollectionHeaderProps) {
  return (
    <motion.div
      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
          {collection.imageUrl ? (
            <img
              src={collection.imageUrl}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">{collection.name}</h2>
            {collection.verified && (
              <Verified className="w-4 h-4 text-blue-500" />
            )}
            <Badge variant="outline">{collection.itemCount} items</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{collection.symbol}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {collection.floorPrice && (
          <div className="text-right">
            <div className="font-semibold">{formatPrice(collection.floorPrice)}</div>
            <div className="text-xs text-muted-foreground">Floor Price</div>
          </div>
        )}
        
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <MoreHorizontal className="w-5 h-5" />
        </motion.div>
      </div>
    </motion.div>
  );
}

interface NFTGalleryProps {
  address?: string;
  chainId?: number;
}

export function NFTGallery({ address, chainId }: NFTGalleryProps) {
  const { wallet } = useWeb3();
  const [nftBalance, setNftBalance] = useState<NFTBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);

  const walletAddress = address || wallet?.address;
  const currentChainId = chainId || wallet?.chainId || 1;

  useEffect(() => {
    if (walletAddress) {
      loadNFTs();
    }
  }, [walletAddress, currentChainId]);

  const loadNFTs = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const balance = await nftService.getNFTsForAddress(walletAddress as any, currentChainId);
      setNftBalance(balance);
      
      // Expand all collections by default
      const collectionAddresses = balance.collections.map(col => col.contractAddress);
      setExpandedCollections(new Set(collectionAddresses));
    } catch (error) {
      console.error('Failed to load NFTs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCollection = (contractAddress: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(contractAddress)) {
      newExpanded.delete(contractAddress);
    } else {
      newExpanded.add(contractAddress);
    }
    setExpandedCollections(newExpanded);
  };

  const filteredCollections = nftBalance?.collections.filter(collection => {
    if (selectedCollection !== 'all' && collection.contractAddress !== selectedCollection) {
      return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        collection.name.toLowerCase().includes(query) ||
        collection.items.some(item => 
          item.metadata.name.toLowerCase().includes(query) ||
          item.tokenId.includes(query)
        )
      );
    }
    
    return true;
  });

  const totalValue = nftBalance?.totalValue || 0;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </Card>
    );
  }

  if (!nftBalance || nftBalance.totalItems === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No NFTs Found</h3>
          <p className="text-muted-foreground mb-4">
            This wallet doesn't contain any NFTs on {currentChainId === 1 ? 'Ethereum' : 'this network'}.
          </p>
          <Button onClick={loadNFTs} variant="outline">
            <Search className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">NFT Collection</h2>
            <p className="text-muted-foreground">
              {nftBalance.totalItems} NFTs • Est. Value: {formatPrice(totalValue)}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search NFTs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          <Select value={selectedCollection} onValueChange={setSelectedCollection}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Collections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Collections</SelectItem>
              {nftBalance.collections.map((collection) => (
                <SelectItem key={collection.contractAddress} value={collection.contractAddress}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Collections */}
      <div className="space-y-4">
        {filteredCollections?.map((collection) => (
          <div key={collection.contractAddress} className="space-y-4">
            <CollectionHeader
              collection={collection}
              isExpanded={expandedCollections.has(collection.contractAddress)}
              onToggle={() => toggleCollection(collection.contractAddress)}
            />
            
            <AnimatePresence>
              {expandedCollections.has(collection.contractAddress) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={cn(
                    viewMode === 'grid' 
                      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                      : "space-y-2"
                  )}>
                    {collection.items
                      .filter(item => {
                        if (!searchQuery) return true;
                        const query = searchQuery.toLowerCase();
                        return (
                          item.metadata.name.toLowerCase().includes(query) ||
                          item.tokenId.includes(query)
                        );
                      })
                      .map((nft) => (
                        <NFTCard
                          key={`${nft.contractAddress}-${nft.tokenId}`}
                          nft={nft}
                          viewMode={viewMode}
                          onClick={() => setSelectedNFT(nft)}
                        />
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}