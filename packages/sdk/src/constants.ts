import { Hex } from "viem";

export const chainIds = [
  1,          // ETH Mainnet
  10,         // Optimism
  56,         // BSC
  130,        // Unichain
  137,        // Polygon
  146,        // Sonic
  169,        // Manta Pacific
  360,        // Molten
  466,        // Appchain
  478,        // Form
  480,        // Worldchain
  // 999,        // HyperEVM
  1996,       // Sanko
  2525,       // inEVM
  // 2741,       // Abstract
  // 5000,       // Mantle
  5330,       // Superseed
  // 7887,       // Kinto
  8333,       // B3
  8453,       // Base
  9745,       // Plasma
  33139,      // ApeChain
  42161,      // Arbitrum
  42220,      // Celo
  57073,      // Ink
  // 543210,     // ZERO
  10241024,   // AlienX
  1380012617, // RARI
] as const;
export type RoutesSupportedChainId = typeof chainIds[number];

export const stables = ["USDC", "USDbC", "USDCe", "USDT", "oUSDT", 'USDT0', 'ApeUSD', 'sUSDe'] as const;
export type RoutesSupportedStable = typeof stables[number];

export const stableAddresses: Record<RoutesSupportedChainId, Partial<Record<RoutesSupportedStable, Hex | undefined>>> = {
  1: {
    USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    oUSDT: "0x1217bfe6c773eec6cc4a38b5dc45b92292b6e189",
  },
  10: {
    USDC: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
    USDCe: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
    USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    oUSDT: "0x1217bfe6c773eec6cc4a38b5dc45b92292b6e189",
  },
  56: {
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
  },
  130: {
    USDC: "0x078D782b760474a361dDA0AF3839290b0EF57AD6",
    USDT0: "0x9151434b16b9763660705744891fa906f660ecc5"
  },
  137: {
    USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    USDCe: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    USDT0: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
  },
  146: {
    USDC: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894'
  },
  169: {
    USDC: '0xb73603C5d87fA094B7314C74ACE2e64D165016fb',
    USDT: '0xf417F5A458eC102B90352F697D6e2Ac3A3d2851f'
  },
  360: {
    USDC: '0xDf0195C990a94006869959a9c77add160164207e'
  },
  466: {
    USDC: '0x675C3ce7F43b00045a4Dab954AF36160fb57cB45'
  },
  478: {
    USDC: '0xFBf489bb4783D4B1B2e7D07ba39873Fb8068507D',
    USDT: '0xFA3198ecF05303a6d96E57a45E6c815055D255b1'
  },
  480: {
    USDC: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1'
  },
  // 999: {
  //   USDT0: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb'
  // },
  1996: {
    USDC: '0x13D675BC5e659b11CFA331594cF35A20815dCF02'
  },
  2525: {
    USDC: '0x8358D8291e3bEDb04804975eEa0fe9fe0fAfB147',
    USDT: '0x97423A68BAe94b5De52d767a17aBCc54c157c0E5'
  },
  // 2741: {
  //   USDT: "0x0709f39376deee2a2dfc94a58edeb2eb9df012bd",
  //   USDCe: "0x84a71ccd554cc1b02749b35d22f684cc8ec987e1",
  // },
  // 5000: {
  //   USDC: "0x09bc4e0d864854c6afb6eb9a9cdf58ac190d0df9",
  //   USDT: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE",
  // },
  5330: {
    USDC: '0xC316C8252B5F2176d0135Ebb0999E99296998F2e',
    oUSDT: '0x1217BfE6c773EEC6cc4A38b5Dc45B92292B6E189',
  },
  // 7887: {
  //   USDC: '0x05DC0010C9902EcF6CBc921c6A4bd971c69E5A2E',
  //   USDT: '0x06D7002A76545f255657aC27313B28831Aa6BceD',
  //   sUSDe: '0x505de0f7a5d786063348aB5BC31e3a21344fA7B0',
  //   USDCe: '0x05dE0003C333A503bea5224fCc64f0D4b5446C38',
  // },
  8333: {
    USDC: '0x2Af198A85F9AA11cd6042A0596FbF23978514DA3'
  },
  8453: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    USDbC: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
    oUSDT: "0x1217bfe6c773eec6cc4a38b5dc45b92292b6e189"
  },
  9745: {
    USDT0: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb'
  },
  33139: {
    ApeUSD: '0xA2235d059F80e176D931Ef76b6C51953Eb3fBEf4',
    USDCe: '0xF1815bd50389c46847f0Bda824eC8da914045D14'
  },
  42161: {
    USDC: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    USDCe: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    USDT0: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
  },
  42220: {
    USDC: "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
    USDT: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
  },
  57073: {
    USDCe: "0xF1815bd50389c46847f0Bda824eC8da914045D14",
    USDT0: "0x0200C29006150606B650577BBE7B6248F58470c1",
  },
  10241024: {
    USDC: '0x14B90E36Ca85D8B563430C0940E80d3A040285cC',
    USDT: '0x486bee264E0F6EB9A1d5947F5FCB097C5378c8E3',
  },
  1380012617: {
    USDC: '0x46B991aCbD9290967a3A9e02f14895c2F9FE809A',
    USDT: '0x362FAE9A75B27BBc550aAc28a7c1F96C8D483120',
    USDCe: '0xFbDa5F676cB37624f28265A144A48B0d6e87d3b6'
  }
}
