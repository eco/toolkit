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

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export const replaceBigIntsWithStrings = (obj: any): any => {
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj))
    return obj.map((x) => replaceBigIntsWithStrings(x));
  if (obj && typeof obj === "object")
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, replaceBigIntsWithStrings(v)]),
    );
  return obj;
};
