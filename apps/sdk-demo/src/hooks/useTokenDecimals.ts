import { RoutesSupportedChainId } from "@eco-foundation/routes-sdk";
import { erc20Abi, Hex } from "viem";
import { useReadContract } from "wagmi";

export function useTokenDecimals(chainId: RoutesSupportedChainId | undefined, tokenAddress: string | undefined, disabled?: boolean) {
  return useReadContract({
    chainId,
    abi: erc20Abi,
    address: tokenAddress as Hex | undefined,
    functionName: 'decimals',
    query: { enabled: Boolean(chainId && tokenAddress && !disabled) }
  });
}
