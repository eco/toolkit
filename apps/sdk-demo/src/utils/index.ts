import { EcoChainIds } from "@eco-foundation/routes-ts"
import { Hex } from "viem"

export const STABLES = [
  'USDC',
  'USDCe',
  'USDbC',
  'USDT',
  'oUSDT',
  'USDT0',
  'ApeUSD'
] as const

export type Stables = typeof STABLES[number]

export const stableAddresses: Partial<Record<EcoChainIds, Partial<Record<Stables, Hex>>>> = {
  42161: { // arbitrum
    USDT: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    USDC: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    USDCe: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
  },
  8453: { // base
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    oUSDT: '0x1217bfe6c773eec6cc4a38b5dc45b92292b6e189',
  },
  42220: { // celo
    USDC: '0xceba9300f2b948710d2653dd7b07f33a8b32118c',
    USDT: '0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e',
  },
  57073: { // ink
    USDC: '0xF1815bd50389c46847f0Bda824eC8da914045D14',
    USDT0: '0x0200C29006150606B650577BBE7B6248F58470c1',
  },
  1: { // mainnet
    USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  },
  5000: { // mantle
    USDT: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE',
    USDC: '0x09bc4e0d864854c6afb6eb9a9cdf58ac190d0df9',
  },
  10: { // optimism
    USDC: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    USDCe: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    oUSDT: '0x1217bfe6c773eec6cc4a38b5dc45b92292b6e189',
  },
  137: { // polygon
    USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    USDCe: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
  },
  130: { // unichain
    USDC: '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
    USDT0: '0x9151434b16b9763660705744891fA906F660EcC5',
  },

  3441006: { // manta pacific sepolia
    USDC: '0x0652aEc2DeE0Fee9D05E614c95Ce8A01a7336cD8',
    USDT: '0xC040bB09ffF7EBb7FDf38831B7c582afddB2CcFE'
  },
  33111: { // curtis testnet
    USDC: '0xE0356B8aD7811dC3e4d61cFD6ac7653e0D31b096',
    USDT: '0xb56415964d3F47fd3390484676e4f394d198374a'
  }
}

export function getAvailableStables(chainId: EcoChainIds) {
  if (!stableAddresses[chainId]) return []
  return Object.entries(stableAddresses[chainId]).map(([stable, address]) => ({
    id: stable as Stables,
    address
  }))
}

export function findTokenByAddress(chain: EcoChainIds, address: string) {
  return getAvailableStables(chain).find((token) => token.address === address)
}
