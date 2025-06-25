'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Key, Copy, Eye, EyeOff, Download, Import, Trash2 } from 'lucide-react';
import { walletManager, type WalletData } from '@/lib/wallet-manager';
import { walletService, type Account } from '@/lib/web3';
import { useWeb3 } from '@/contexts/Web3Context';
import { toast } from 'sonner';

export function WalletManager() {
  const { setWallet } = useWeb3();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newWalletData, setNewWalletData] = useState<WalletData | null>(null);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [importData, setImportData] = useState({
    seedPhrase: '',
    privateKey: '',
    name: '',
    password: ''
  });
  const [activeTab, setActiveTab] = useState('create');

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleCreateWallet = () => {
    try {
      const wallet = walletManager.generateWallet();
      setNewWalletData(wallet);
      toast.success('New wallet generated successfully!');
    } catch (error) {
      console.error('Failed to create wallet:', error);
      toast.error('Failed to create wallet');
    }
  };

  const handleImportMnemonic = () => {
    try {
      if (!importData.seedPhrase.trim()) {
        toast.error('Please enter a seed phrase');
        return;
      }

      const wallet = walletManager.importFromMnemonic(
        importData.seedPhrase.trim(),
        importData.name || 'Imported Wallet'
      );

      setNewWalletData(wallet);
      toast.success('Wallet imported successfully!');
    } catch (error) {
      console.error('Failed to import wallet:', error);
      toast.error('Invalid seed phrase');
    }
  };

  const handleImportPrivateKey = () => {
    try {
      if (!importData.privateKey.trim()) {
        toast.error('Please enter a private key');
        return;
      }

      const wallet = walletManager.importFromPrivateKey(
        importData.privateKey.trim(),
        importData.name || 'Imported Wallet'
      );

      setNewWalletData(wallet);
      toast.success('Wallet imported successfully!');
    } catch (error) {
      console.error('Failed to import wallet:', error);
      toast.error('Invalid private key');
    }
  };

  const handleSaveWallet = () => {
    if (!newWalletData || !importData.password) {
      toast.error('Please set a password');
      return;
    }

    try {
      walletManager.saveWalletToStorage(newWalletData, importData.password);

      // Add to wallet service
      const account: Account = {
        id: Date.now().toString(),
        name: newWalletData.name,
        address: newWalletData.address,
        type: newWalletData.mnemonic ? 'generated' : 'imported'
      };

      walletService.addAccount(account);

      // Set as current wallet
      setWallet({
        address: newWalletData.address,
        balance: '0.0',
        chainId: 1,
        chain: walletService.getCurrentChain()
      });

      // Reset form
      setNewWalletData(null);
      setImportData({ seedPhrase: '', privateKey: '', name: '', password: '' });

      toast.success('Wallet saved successfully!');
      loadAccounts();
    } catch (error) {
      console.error('Failed to save wallet:', error);
      toast.error('Failed to save wallet');
    }
  };

  const loadAccounts = () => {
    const stored = walletManager.getStoredAccounts();
    setAccounts(stored);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadBackup = () => {
    if (!newWalletData) return;

    const backup = {
      mnemonic: newWalletData.mnemonic,
      privateKey: newWalletData.privateKey,
      address: newWalletData.address,
      createdAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Backup downloaded');
  };

  const handleSelectAccount = async (account: Account) => {
    try {
      // Get balance for the selected account
      const balance = await walletService.getBalance(account.address);

      setWallet({
        address: account.address,
        balance,
        chainId: 1,
        chain: walletService.getCurrentChain()
      });

      walletService.switchAccount(account.id);
      toast.success(`Switched to ${account.name}`);
    } catch (error) {
      console.error('Failed to switch account:', error);
      toast.error('Failed to switch account');
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    try {
      walletManager.removeWalletFromStorage(accountId);
      loadAccounts();
      toast.success('Account deleted successfully');
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>钱包管理</CardTitle>
          <CardDescription>
            创建新钱包或导入现有钱包
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create">创建新钱包</TabsTrigger>
              <TabsTrigger value="import">导入钱包</TabsTrigger>
              <TabsTrigger value="accounts">我的账户</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4 mt-6">
              {!newWalletData ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      创建新钱包
                    </CardTitle>
                    <CardDescription>
                      生成一个带有12个助记词的新钱包
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleCreateWallet} className="w-full">
                      生成新钱包
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>钱包已生成</CardTitle>
                    <CardDescription>
                      请安全保存您的助记词，您需要它来恢复钱包。
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">地址:</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-muted rounded text-sm">
                          {newWalletData.address}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(newWalletData.address)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {newWalletData.mnemonic && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">助记词:</label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                          >
                            {showSeedPhrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="p-3 bg-muted rounded border">
                          {showSeedPhrase ? (
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              {newWalletData.mnemonic.split(' ').map((word, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{index + 1}.</span>
                                  <span>{word}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">点击眼睛图标显示助记词</p>
                          )}
                        </div>
                        {showSeedPhrase && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(newWalletData.mnemonic!)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              复制助记词
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={downloadBackup}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              下载备份
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-2">
                      <label className="text-sm font-medium">设置密码:</label>
                      <input
                        type="password"
                        placeholder="输入密码保护您的钱包"
                        value={importData.password}
                        onChange={(e) => setImportData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setNewWalletData(null)}
                        className="flex-1"
                      >
                        取消
                      </Button>
                      <Button
                        onClick={handleSaveWallet}
                        disabled={!importData.password}
                        className="flex-1"
                      >
                        保存钱包
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="import" className="space-y-4 mt-6">
              <Tabs defaultValue="mnemonic">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mnemonic">助记词导入</TabsTrigger>
                  <TabsTrigger value="privatekey">私钥导入</TabsTrigger>
                </TabsList>

                <TabsContent value="mnemonic" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Import className="h-5 w-5" />
                        导入助记词
                      </CardTitle>
                      <CardDescription>
                        输入您的12个助记词来恢复钱包
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">助记词:</label>
                        <textarea
                          placeholder="输入您的12个助记词，用空格分隔"
                          value={importData.seedPhrase}
                          onChange={(e) => setImportData(prev => ({ ...prev, seedPhrase: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md text-sm h-20 resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">钱包名称:</label>
                        <input
                          type="text"
                          placeholder="给您的钱包起个名字"
                          value={importData.name}
                          onChange={(e) => setImportData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                      </div>

                      <Button
                        onClick={handleImportMnemonic}
                        disabled={!importData.seedPhrase.trim()}
                        className="w-full"
                      >
                        导入钱包
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="privatekey" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        导入私钥
                      </CardTitle>
                      <CardDescription>
                        输入您的私钥来导入钱包
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">私钥:</label>
                        <input
                          type="password"
                          placeholder="输入您的私钥 (0x...)"
                          value={importData.privateKey}
                          onChange={(e) => setImportData(prev => ({ ...prev, privateKey: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">钱包名称:</label>
                        <input
                          type="text"
                          placeholder="给您的钱包起个名字"
                          value={importData.name}
                          onChange={(e) => setImportData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                      </div>

                      <Button
                        onClick={handleImportPrivateKey}
                        disabled={!importData.privateKey.trim()}
                        className="w-full"
                      >
                        导入钱包
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="accounts" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>我的账户</CardTitle>
                  <CardDescription>
                    管理您保存的钱包账户
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {accounts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">暂无保存的账户</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        创建或导入钱包后，账户将显示在这里
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {accounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold">
                                {account.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{account.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {account.address.slice(0, 6)}...{account.address.slice(-4)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant={account.type === 'generated' ? 'default' : 'secondary'}>
                              {account.type === 'generated' ? '已生成' : '已导入'}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectAccount(account)}
                            >
                              选择
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(account.address)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAccount(account.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}