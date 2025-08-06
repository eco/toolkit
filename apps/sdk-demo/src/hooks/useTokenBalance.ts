import { RoutesSupportedChainId } from "@eco-foundation/routes-sdk";
import { erc20Abi, Hex } from "viem";
import { useReadContract } from "wagmi";

export function useTokenBalance(chainId: RoutesSupportedChainId | undefined, tokenAddress: string | undefined, address: Hex | undefined, disabled?: boolean) {
  return useReadContract({
    chainId,
    abi: erc20Abi,
    address: tokenAddress as Hex | undefined,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: Boolean(chainId && tokenAddress && address && !disabled) }
  });
}
