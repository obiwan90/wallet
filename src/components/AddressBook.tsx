'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Book,
  Plus,
  Search,
  Star,
  Edit,
  Trash2,
  Copy,
  Send,
  Filter,
  Download,
  Upload,
  Heart,
  HeartOff,
  User,
  Building,
  DollarSign,
  FileText
} from 'lucide-react';
import { 
  addressBookService, 
  type AddressBookEntry, 
  type AddressBookFilter,
  formatAddressName,
  getCategoryIcon,
  getCategoryColor,
  generateAvatar
} from '@/lib/address-book';
import { formatAddress, isValidAddress } from '@/lib/web3';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useWeb3 } from '@/contexts/Web3Context';

interface AddressBookProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress?: (address: string, name?: string) => void;
  mode?: 'manage' | 'select'; // manage: full management, select: selection only
}

export function AddressBook({ 
  isOpen, 
  onClose, 
  onSelectAddress,
  mode = 'manage' 
}: AddressBookProps) {
  const { wallet } = useWeb3();
  const [entries, setEntries] = useState<AddressBookEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<AddressBookEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AddressBookEntry | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    category: 'personal' as AddressBookEntry['category'],
    tags: '',
  });

  // Load entries
  const loadEntries = () => {
    const allEntries = addressBookService.getAddresses();
    setEntries(allEntries);
  };

  useEffect(() => {
    if (isOpen) {
      loadEntries();
    }
  }, [isOpen]);

  // Filter entries
  useEffect(() => {
    const filter: AddressBookFilter = {
      searchTerm: searchTerm || undefined,
      category: selectedCategory === 'all' ? undefined : selectedCategory as AddressBookEntry['category'],
      isFavorite: showFavoritesOnly || undefined,
      chainId: wallet?.chainId,
    };

    const filtered = addressBookService.getAddresses(filter);
    setFilteredEntries(filtered);
  }, [entries, searchTerm, selectedCategory, showFavoritesOnly, wallet?.chainId]);

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      description: '',
      category: 'personal',
      tags: '',
    });
    setEditingEntry(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.address.trim()) {
      toast.error('请填写名称和地址');
      return;
    }

    if (!isValidAddress(formData.address)) {
      toast.error('无效的地址格式');
      return;
    }

    try {
      const entryData = {
        name: formData.name.trim(),
        address: formData.address.trim() as any,
        description: formData.description.trim() || undefined,
        category: formData.category,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        chainId: wallet?.chainId,
      };

      if (editingEntry) {
        addressBookService.updateAddress(editingEntry.id, entryData);
        toast.success('地址已更新');
      } else {
        addressBookService.addAddress(entryData);
        toast.success('地址已添加');
      }

      loadEntries();
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error(error instanceof Error ? error.message : '保存失败');
    }
  };

  const handleEdit = (entry: AddressBookEntry) => {
    setEditingEntry(entry);
    setFormData({
      name: entry.name,
      address: entry.address,
      description: entry.description || '',
      category: entry.category,
      tags: entry.tags?.join(', ') || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (entry: AddressBookEntry) => {
    if (!confirm(`确定要删除 "${entry.name}" 吗？`)) return;

    try {
      addressBookService.deleteAddress(entry.id);
      toast.success('地址已删除');
      loadEntries();
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast.error('删除失败');
    }
  };

  const handleToggleFavorite = (entry: AddressBookEntry) => {
    try {
      addressBookService.toggleFavorite(entry.id);
      loadEntries();
      toast.success(entry.isFavorite ? '已取消收藏' : '已添加到收藏');
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('操作失败');
    }
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('地址已复制');
    } catch (error) {
      console.error('Failed to copy address:', error);
      toast.error('复制失败');
    }
  };

  const handleSelectAddress = (entry: AddressBookEntry) => {
    if (onSelectAddress) {
      onSelectAddress(entry.address, entry.name);
      onClose();
    }
  };

  const getCategoryBadgeVariant = (category: AddressBookEntry['category']) => {
    switch (category) {
      case 'personal': return 'default';
      case 'business': return 'secondary';
      case 'defi': return 'outline';
      case 'other': return 'destructive';
      default: return 'outline';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl sm:max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Book className="w-5 h-5" />
            {mode === 'select' ? '选择地址' : '地址簿'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[60vh]">
          {/* Filters & Search */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>搜索</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="搜索名称、地址或标签..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>分类</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  <SelectItem value="personal">个人</SelectItem>
                  <SelectItem value="business">商务</SelectItem>
                  <SelectItem value="defi">DeFi</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={showFavoritesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="flex-1"
              >
                <Star className="w-4 h-4 mr-2" />
                收藏夹
              </Button>
            </div>

            {mode === 'manage' && (
              <>
                <Separator />
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加地址
                </Button>
              </>
            )}
          </div>

          {/* Address List */}
          <div className="lg:col-span-2">
            <ScrollArea className="h-full">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Book className="w-8 h-8 mx-auto mb-2" />
                    <p>暂无地址记录</p>
                  </div>
                ) : (
                  filteredEntries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      variants={itemVariants}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: generateAvatar(entry.address) }}
                          >
                            {entry.name[0]?.toUpperCase() || '?'}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold truncate">{entry.name}</h4>
                              <Badge variant={getCategoryBadgeVariant(entry.category)} className="text-xs">
                                {getCategoryIcon(entry.category)} {entry.category}
                              </Badge>
                              {entry.isFavorite && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            
                            <div className="text-sm text-muted-foreground font-mono">
                              {formatAddress(entry.address)}
                            </div>
                            
                            {entry.description && (
                              <p className="text-sm text-muted-foreground mt-1 truncate">
                                {entry.description}
                              </p>
                            )}
                            
                            {entry.tags && entry.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {entry.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {mode === 'select' ? (
                            <Button
                              size="sm"
                              onClick={() => handleSelectAddress(entry)}
                            >
                              选择
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleFavorite(entry)}
                              >
                                {entry.isFavorite ? (
                                  <HeartOff className="w-4 h-4" />
                                ) : (
                                  <Heart className="w-4 h-4" />
                                )}
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyAddress(entry.address)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              
                              {onSelectAddress && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSelectAddress(entry)}
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(entry)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(entry)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </ScrollArea>
          </div>
        </div>

        {/* Add/Edit Form Dialog */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? '编辑地址' : '添加新地址'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="输入地址名称"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">地址 *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="0x..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value as AddressBookEntry['category'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">👤 个人</SelectItem>
                    <SelectItem value="business">🏢 商务</SelectItem>
                    <SelectItem value="defi">💰 DeFi</SelectItem>
                    <SelectItem value="other">📝 其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="可选的描述信息"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">标签</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="标签1, 标签2, 标签3"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingEntry ? '更新' : '添加'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}