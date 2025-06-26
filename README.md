# 🪄 Magic Wallet

> 现代化 Web3 钱包 - 集成 AI 分析功能的智能数字资产管理工具

![Magic Wallet](https://img.shields.io/badge/Magic-Wallet-purple?style=for-the-badge&logo=ethereum)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Viem](https://img.shields.io/badge/Viem-2.31-green?style=for-the-badge)

## ✨ 核心功能

### 🔐 独立钱包管理
- **创建新钱包** - 生成安全的 12 词助记词
- **导入现有钱包** - 支持助记词和私钥导入
- **多账户支持** - 管理多个钱包账户（BIP44 标准）
- **加密存储** - AES-GCM + PBKDF2 本地安全加密

### 💎 现代化 Web3 集成
- **基于 Viem** - 替代传统 ethers.js，更好的 TypeScript 支持
- **多链支持** - Ethereum、Polygon、BSC、Avalanche、Arbitrum、Optimism、Base
- **网络切换** - 动态网络切换，支持自定义 RPC
- **实时余额** - 多 RPC 故障转移，确保服务可用性

### 📊 交易和资产管理
- **发送交易** - 原生代币和 ERC-20 代币转账
- **交易历史** - 真实区块链数据查询，支持区块链浏览器跳转
- **实时价格** - 集成 CoinGecko + CryptoCompare API，显示实时价格和24h变化
- **投资组合** - 自动计算总价值和资产分布

### 📱 用户友好功能
- **接收功能** - 高质量 QR 码生成、地址分享和复制
- **地址簿** - 完整地址管理系统，支持分类、标签、收藏和搜索
- **智能集成** - 地址簿与发送功能无缝集成
- **响应式设计** - 完美支持手机、平板和桌面设备

### 🤖 AI 驱动的智能分析
- **投资组合分析** - AI 评估钱包健康度和风险等级
- **收益机会推荐** - 智能推荐 DeFi 质押和流动性挖矿机会
- **智能合约验证** - 自动检测合约安全性和gas优化建议
- **Python 执行环境** - 内置数据分析和区块链脚本执行

### 🎨 用户体验
- **完全中文化** - 针对中文用户优化的界面和错误提示
- **现代化设计** - shadcn/ui + Tailwind CSS + Framer Motion 动画
- **暗黑模式** - 默认暗黑主题，支持主题切换
- **直观导航** - 清晰的标签页式界面和操作流程

## 🛠️ 技术栈

### 前端框架
- **Next.js 15** - React 全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 现代 CSS 框架
- **shadcn/ui** - 高质量 React 组件库

### Web3 集成
- **Viem** - 现代化以太坊库，替代 ethers.js
- **BIP39** - 助记词生成和验证
- **多链RPC** - 支持主流区块链网络
- **智能缓存** - 优化API调用性能

### AI & 自动化
- **MCP (Model Context Protocol)** - AI 集成协议
- **21st-dev/magic** - AI 分析服务
- **Puppeteer** - 浏览器自动化

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/obiwan90/wallet.git
cd wallet
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 访问应用
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📖 使用指南

### 创建钱包
1. 首次访问时选择"创建新钱包"
2. 安全保存生成的12词助记词
3. 设置密码并保存钱包
4. 开始使用钱包功能

### 导入钱包
1. 在登录页面选择"导入钱包"
2. 输入助记词或私钥
3. 设置钱包密码
4. 完成导入并开始使用

### 发送交易
1. 在仪表盘点击"Send"按钮
2. 选择发送账户和币种
3. 输入接收地址（可从地址簿选择）
4. 输入发送数量，确认交易

### 接收代币
1. 点击"Receive"按钮
2. 复制钱包地址或扫描QR码
3. 分享给发送方
4. 在交易历史中查看到账记录

### 地址簿管理
1. 点击地址簿图标
2. 添加常用地址并设置分类
3. 在发送交易时快速选择地址
4. 管理收藏和标签

### 查看交易历史
1. 切换到"Transactions"标签
2. 查看所有交易记录和状态
3. 点击交易可跳转到区块链浏览器
4. 实时刷新获取最新交易

## 🔧 配置 MCP 服务

### 配置 AI 分析功能
在 `.cursor/mcp.json` 中添加：

```json
{
  "@21st-dev/magic": {
    "command": "npx",
    "args": ["-y", "@21st-dev/magic@latest", "API_KEY=\"your-api-key\""]
  }
}
```

## 🌟 特色亮点

- **🔒 安全第一** - 私钥本地AES-GCM加密，助记词BIP39标准生成
- **📊 实时数据** - 真实区块链数据查询，实时价格和交易历史
- **📱 现代体验** - 响应式设计，支持QR码分享和地址簿管理
- **⚡ 性能优越** - 基于 Viem 的现代化架构，智能缓存优化
- **🌐 多链生态** - 支持7大主流区块链网络，动态RPC切换
- **🎯 用户友好** - 完整中文界面，直观操作流程

## 🛡️ 安全说明

- 所有私钥和助记词均在本地加密存储
- 不会上传任何敏感信息到服务器
- 建议定期备份钱包文件
- 请妥善保管助记词和密码

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

- GitHub: [@obiwan90](https://github.com/obiwan90)

---

⭐ 如果这个项目对您有帮助，请给它一个 Star！
