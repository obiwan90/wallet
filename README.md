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
- **多账户支持** - 管理多个钱包账户
- **加密存储** - 本地安全加密保存

### 💎 现代化 Web3 集成
- **基于 Viem** - 替代传统 ethers.js，更好的 TypeScript 支持
- **多链支持** - Ethereum、Polygon、BSC、Avalanche
- **网络切换** - 一键切换不同区块链网络
- **资产管理** - 查看余额和投资组合

### 🤖 AI 驱动的智能分析
- **投资组合分析** - AI 评估钱包健康度和风险等级
- **收益机会推荐** - 智能推荐 DeFi 质押和流动性挖矿机会
- **智能合约验证** - 自动检测合约安全性和gas优化建议
- **Python 执行环境** - 内置数据分析和区块链脚本执行

### 🎨 用户体验
- **完全中文化** - 针对中文用户优化的界面
- **现代化设计** - shadcn/ui + Tailwind CSS
- **响应式布局** - 支持桌面和移动设备
- **直观导航** - 清晰的标签页式界面

## 🛠️ 技术栈

### 前端框架
- **Next.js 15** - React 全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 现代 CSS 框架
- **shadcn/ui** - 高质量 React 组件库

### Web3 集成
- **Viem** - 现代化以太坊库
- **Wagmi** - React Hooks for Ethereum
- **BIP39** - 助记词生成和验证

### AI & 自动化
- **MCP (Model Context Protocol)** - AI 集成协议
- **21st-dev/magic** - AI 分析服务
- **Puppeteer** - 浏览器自动化

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/obiwan90/magic-wallet.git
cd magic-wallet
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
1. 点击"钱包管理"标签
2. 选择"创建新钱包"
3. 安全保存生成的助记词
4. 设置密码并保存钱包

### 导入钱包
1. 进入"导入钱包"页面
2. 输入助记词或私钥
3. 设置钱包名称和密码
4. 完成导入

### AI 分析功能
1. 连接钱包后点击"Magic AI"标签
2. 运行投资组合分析获取 AI 建议
3. 使用智能合约验证工具
4. 执行自定义 Python 分析脚本

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

- **🔒 安全第一** - 私钥本地加密，助记词安全生成
- **🤖 AI 赋能** - 智能投资建议和风险评估
- **⚡ 性能优越** - 基于 viem 的现代化架构
- **🌐 多链生态** - 支持主流区块链网络
- **🎯 用户友好** - 简洁直观的中文界面

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
