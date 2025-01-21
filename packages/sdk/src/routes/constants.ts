import { Token, ChainId } from "./types.js";

export const NetworkTokens: Record<ChainId, Partial<Record<Token, Hex | undefined>>> = {
  10: {
    USDC: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
    USDCe: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
    USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
  },
  5000: {
    USDC: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE",
    USDT: "0x09bc4e0d864854c6afb6eb9a9cdf58ac190d0df9",
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
