'use client';

import { useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Code, 
  TrendingUp, 
 
  Play, 
  FileCode,
  BarChart3,
  Brain
} from 'lucide-react';
import { toast } from 'sonner';
import { magicService, type MagicAnalysisResult } from '@/lib/magic-service';

export function MagicPanel() {
  const { wallet, isConnected } = useWeb3();
  const [activeTab, setActiveTab] = useState('analysis');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<MagicAnalysisResult[]>([]);
  const [pythonCode, setPythonCode] = useState(`# Portfolio Analysis Magic 🎯
import json
from datetime import datetime

# Mock wallet data analysis
def analyze_portfolio(wallet_address, balance):
    analysis = {
        "portfolio_health": "Excellent" if float(balance) > 1 else "Good" if float(balance) > 0.1 else "Needs Attention",
        "diversification_score": 85,
        "risk_level": "Medium",
        "recommended_actions": [
            "Consider DeFi staking opportunities",
            "Diversify into stable coins",
            "Monitor gas fee optimization"
        ],
        "yield_opportunities": [
            {"protocol": "Compound", "apy": "4.2%", "risk": "Low"},
            {"protocol": "Aave", "apy": "3.8%", "risk": "Low"},
            {"protocol": "Uniswap V3", "apy": "12.5%", "risk": "Medium"}
        ]
    }
    
    print("🔮 Magic Portfolio Analysis Complete!")
    print(f"📊 Portfolio Health: {analysis['portfolio_health']}")
    print(f"🎯 Diversification Score: {analysis['diversification_score']}/100")
    print(f"⚡ Risk Level: {analysis['risk_level']}")
    print("\\n💡 Recommended Actions:")
    for action in analysis["recommended_actions"]:
        print(f"  • {action}")
    
    print("\\n🌟 Yield Opportunities:")
    for opp in analysis["yield_opportunities"]:
        print(f"  • {opp['protocol']}: {opp['apy']} APY ({opp['risk']} risk)")
    
    return analysis

# Execute the magic analysis
if wallet_address and balance:
    result = analyze_portfolio(wallet_address, balance)
    print("\\n✨ Analysis saved to result variable")
else:
    print("⚠️  Please connect wallet first")
`);

  const [smartContractCode, setSmartContractCode] = useState(`// Smart Contract Validation Magic ⚡
pragma solidity ^0.8.0;

contract SimpleWallet {
    address public owner;
    mapping(address => uint256) public balances;
    
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdrawal(msg.sender, amount);
    }
    
    function getBalance() external view returns (uint256) {
        return balances[msg.sender];
    }
}
`);

  const executePortfolioAnalysis = async () => {
    if (!isConnected || !wallet) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const results = await magicService.executePortfolioAnalysis(wallet.address, wallet.balance);
      setAnalysisResults(results);
      toast.success('Portfolio analysis complete!');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const validateSmartContract = async () => {
    setIsAnalyzing(true);
    try {
      const results = await magicService.validateSmartContract(smartContractCode);
      setAnalysisResults(results);
      toast.success('Smart contract validation complete!');
    } catch (error) {
      console.error('Validation failed:', error);
      toast.error('Validation failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const executePythonMagic = async () => {
    if (!pythonCode.trim()) {
      toast.error('Please enter Python code');
      return;
    }

    setIsAnalyzing(true);
    try {
      const walletData = wallet ? { address: wallet.address, balance: wallet.balance } : undefined;
      const results = await magicService.executePythonCode(pythonCode, walletData);
      setAnalysisResults(results);
      toast.success('Python magic executed!');
    } catch (error) {
      console.error('Execution failed:', error);
      toast.error('Execution failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Connect your wallet to unlock magic features</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Magic Panel
          <Badge variant="secondary" className="ml-2">
            Powered by MCP
          </Badge>
        </CardTitle>
        <CardDescription>
          Advanced AI-powered analysis and smart contract tools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="contract" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Contract
            </TabsTrigger>
            <TabsTrigger value="python" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Python Magic
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Portfolio Analysis</h3>
                <Button 
                  onClick={executePortfolioAnalysis}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Run Magic Analysis
                    </>
                  )}
                </Button>
              </div>

              {wallet && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Address:</span>
                      <br />
                      <code className="text-xs">{wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}</code>
                    </div>
                    <div>
                      <span className="font-medium">Balance:</span>
                      <br />
                      <span className="text-lg font-semibold">{parseFloat(wallet.balance).toFixed(4)} ETH</span>
                    </div>
                  </div>
                </div>
              )}

              {analysisResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Analysis Results:</h4>
                  <div className="space-y-2">
                    {analysisResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : result.type === 'warning'
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                            : result.type === 'info'
                            ? 'bg-blue-50 border-blue-200 text-blue-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                      >
                        {result.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contract" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Smart Contract Validator</h3>
                <Button 
                  onClick={validateSmartContract}
                  disabled={isAnalyzing}
                  variant="outline"
                >
                  {isAnalyzing ? (
                    <>
                      <Code className="h-4 w-4 mr-2 animate-pulse" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Code className="h-4 w-4 mr-2" />
                      Validate Contract
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Solidity Code:</label>
                <textarea
                  value={smartContractCode}
                  onChange={(e) => setSmartContractCode(e.target.value)}
                  className="w-full h-64 px-3 py-2 border rounded-md text-sm font-mono"
                  placeholder="Enter your Solidity smart contract code..."
                />
              </div>

              {analysisResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Validation Results:</h4>
                  <div className="space-y-2">
                    {analysisResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : result.type === 'warning'
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                            : result.type === 'info'
                            ? 'bg-blue-50 border-blue-200 text-blue-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                      >
                        {result.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="python" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Python Magic Executor</h3>
                <Button 
                  onClick={executePythonMagic}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500"
                >
                  {isAnalyzing ? (
                    <>
                      <Play className="h-4 w-4 mr-2 animate-pulse" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Execute Python
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Python Code:</label>
                <textarea
                  value={pythonCode}
                  onChange={(e) => setPythonCode(e.target.value)}
                  className="w-full h-64 px-3 py-2 border rounded-md text-sm font-mono"
                  placeholder="Enter your Python code for blockchain analysis..."
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Magic Features:</strong> Your Python code has access to wallet data, 
                  Web3 libraries, and advanced analytics. Use variables <code>wallet_address</code> and 
                  <code>balance</code> for your analysis.
                </p>
              </div>

              {analysisResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Execution Results:</h4>
                  <div className="space-y-2">
                    {analysisResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : result.type === 'warning'
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                            : result.type === 'info'
                            ? 'bg-blue-50 border-blue-200 text-blue-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                      >
                        {result.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}