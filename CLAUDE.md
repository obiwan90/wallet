# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm start` - Start production server

### Project Structure
```
src/
├── app/                    # Next.js 15 app router
│   ├── layout.tsx         # Root layout with theme provider
│   └── page.tsx           # Main wallet dashboard
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── WalletManager.tsx  # Core wallet operations
│   ├── MagicPanel.tsx     # AI analysis interface
│   ├── NetworkSwitcher.tsx # Multi-chain support
│   └── theme-toggle.tsx   # Dark/light mode
├── contexts/
│   └── Web3Context.tsx    # Global wallet state
└── lib/
    ├── web3.ts           # Viem client configuration
    ├── wallet-manager.ts # Wallet operations & encryption
    └── magic-service.ts  # AI analysis services
```

## Architecture Overview

### Web3 Integration
- **Viem-based**: Modern replacement for ethers.js with better TypeScript support
- **Multi-chain**: Supports Ethereum, Polygon, BSC, Avalanche, Arbitrum, Optimism, Base
- **Account Management**: Local encrypted storage with BIP39 mnemonic support
- **Network Switching**: Dynamic chain switching with RPC endpoints

### State Management
- **Web3Context**: Global provider for wallet state, balance, and network
- **WalletService**: Singleton for blockchain interactions and account management
- **WalletManager**: Handles wallet creation, import, and encryption

### AI Integration
- **MagicService**: Simulates AI analysis (portfolio analysis, smart contract validation)
- **Python Execution**: Designed for MCP integration with code execution
- **Portfolio Analysis**: Automated DeFi opportunity detection and risk assessment

### UI Framework
- **Next.js 15**: App router with React 19
- **shadcn/ui**: Component library with Radix UI primitives
- **Tailwind CSS**: Utility-first styling
- **next-themes**: Dark/light mode with SSR support

## Key Patterns

### Wallet Operations
- All wallet data is encrypted before localStorage storage
- Private keys never leave the client
- Mnemonic phrases use BIP39 validation
- Multi-account support with derivation paths

### Network Management
- Dynamic RPC client creation per network switch
- Automatic balance refresh on network changes
- Preferred network persistence across sessions

### Error Handling
- Graceful fallbacks for blockchain operations
- User-friendly error messages for wallet operations
- Silent failures for non-critical operations (balance refresh)

## Important Notes

- **Security**: All sensitive data is encrypted locally, never transmitted
- **Chinese Localization**: UI text is primarily in Chinese for target audience
- **MCP Ready**: Service layer prepared for Model Context Protocol integration
- **Production Encryption**: Current encryption is simplified - use proper crypto libraries for production
- **Gas Optimization**: Service includes gas timing analysis for transaction optimization