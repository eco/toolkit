import { RoutesSupportedChainId } from "@eco-foundation/routes-sdk";
import { Hex } from "viem";
import { useBalance } from "wagmi";

export function useNativeTokenBalance(chainId: RoutesSupportedChainId | undefined, address: Hex | undefined, disabled?: boolean) {
  return useBalance({
    chainId,
    address,
    query: { enabled: Boolean(chainId && address && !disabled) }
  })
}
