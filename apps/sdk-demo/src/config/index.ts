import { RoutesSupportedChainId, RoutesSupportedStable } from "@eco-foundation/routes-sdk"
import { Hex } from "viem"
import { getAvailableStables } from "../utils"

export type MyTokenConfig = {
  id: RoutesSupportedStable,
  address: Hex
}

export type MyChainConfig = {
  label: string,
  stables: MyTokenConfig[]
}

export const chains: Record<RoutesSupportedChainId, MyChainConfig> = {
  1: {
    label: "Ethereum Mainnet",
    stables: getAvailableStables(1)
  },
  10: {
    label: "Optimism",
    stables: getAvailableStables(10)
  },
  130: {
    label: "Unichain",
    stables: getAvailableStables(130)
  },
  137: {
    label: "Polygon",
    stables: getAvailableStables(137)
  },
  // 2741: {
  //   label: "Abstract",
  //   stables: getAvailableStables(2741)
  // },
  // 5000: {
  //   label: "Mantle",
  //   stables: getAvailableStables(5000)
  // },
  8453: {
    label: "Base",
    stables: getAvailableStables(8453)
  },
  42161: {
    label: "Arbitrum",
    stables: getAvailableStables(42161)
  },
  42220: {
    label: "Celo",
    stables: getAvailableStables(42220)
  },
  57073: {
    label: "Ink",
    stables: getAvailableStables(57073)
  }
}