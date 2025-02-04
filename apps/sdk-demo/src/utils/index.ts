import { RoutesSupportedChainId, RoutesSupportedStable, stableAddresses } from "@eco-foundation/routes-sdk"
import { MyTokenConfig } from "../config"

export function getAvailableStables(chain: RoutesSupportedChainId): MyTokenConfig[] {
  return Object.entries(stableAddresses[chain]).map(([stable, address]) => ({
    id: stable as RoutesSupportedStable,
    address
  }))
}

export function findTokenByAddress(chain: RoutesSupportedChainId, address: string): MyTokenConfig | undefined {
  return getAvailableStables(chain).find((token) => token.address === address)
}
