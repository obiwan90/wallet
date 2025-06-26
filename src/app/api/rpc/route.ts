import { NextRequest, NextResponse } from 'next/server';

// RPC Proxy API Route for handling CORS issues
export async function POST(request: NextRequest) {
  try {
    const { chainId, rpcUrl, body } = await request.json();

    // Validate inputs
    if (!chainId || !rpcUrl || !body) {
      return NextResponse.json(
        { error: 'Missing required parameters: chainId, rpcUrl, body' },
        { status: 400 }
      );
    }

    // Whitelist of allowed RPC URLs for security
    const allowedRpcUrls = [
      'https://ethereum.publicnode.com',
      'https://rpc.ankr.com/eth',
      'https://1rpc.io/eth',
      'https://cloudflare-eth.com',
      'https://polygon-rpc.com',
      'https://rpc.ankr.com/polygon',
      'https://1rpc.io/matic',
      'https://polygon.publicnode.com',
      'https://bsc-dataseed.binance.org',
      'https://rpc.ankr.com/bsc',
      'https://1rpc.io/bnb',
      'https://bsc.publicnode.com',
      'https://api.avax.network/ext/bc/C/rpc',
      'https://rpc.ankr.com/avalanche',
      'https://1rpc.io/avax/c',
      'https://avalanche.publicnode.com',
      'https://arb1.arbitrum.io/rpc',
      'https://rpc.ankr.com/arbitrum',
      'https://1rpc.io/arb',
      'https://arbitrum.publicnode.com',
      'https://mainnet.optimism.io',
      'https://rpc.ankr.com/optimism',
      'https://1rpc.io/op',
      'https://optimism.publicnode.com',
      'https://mainnet.base.org',
      'https://rpc.ankr.com/base',
      'https://1rpc.io/base',
      'https://base.publicnode.com'
    ];

    if (!allowedRpcUrls.includes(rpcUrl)) {
      return NextResponse.json(
        { error: 'RPC URL not allowed' },
        { status: 403 }
      );
    }

    // Forward the request to the RPC endpoint
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Magic-Wallet/1.0',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`RPC request failed: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `RPC request failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the RPC response with proper CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}