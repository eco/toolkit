import { Hex } from "viem";

export const chainIds = [1, 10, 137, 2741, 5000, 8453, 42161] as const;
export type RoutesSupportedChainId = typeof chainIds[number];

export const stables = ["USDC", "USDbC", "USDCe", "USDT"] as const;
export type RoutesSupportedStable = typeof stables[number];

export const stableAddresses: Record<RoutesSupportedChainId, Partial<Record<RoutesSupportedStable, Hex | undefined>>> = {
  1: {
    USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  },
  10: {
    USDC: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
    USDCe: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
    USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
  },
  137: {
    USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    USDT: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
  },
  2741: {
    USDT: "0x0709f39376deee2a2dfc94a58edeb2eb9df012bd",
    USDCe: "0x84a71ccd554cc1b02749b35d22f684cc8ec987e1",
  },
  5000: {
    USDC: "0x09bc4e0d864854c6afb6eb9a9cdf58ac190d0df9",
    USDT: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE",
  },
  8453: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    USDbC: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
  },
  42161: {
    USDC: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    USDCe: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    USDT: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
  },
}
