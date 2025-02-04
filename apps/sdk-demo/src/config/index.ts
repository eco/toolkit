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
  10: {
    label: "Optimism",
    stables: getAvailableStables(10)
  },
  5000: {
    label: "Mantle",
    stables: getAvailableStables(5000)
  },
  8453: {
    label: "Base",
    stables: getAvailableStables(8453)
  },
  42161: {
    label: "Arbitrum",
    stables: getAvailableStables(42161)
  }
}