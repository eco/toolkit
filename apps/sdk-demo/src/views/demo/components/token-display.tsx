import { RoutesSupportedChainId } from "@eco-foundation/routes-sdk";
import { useTokenDecimals } from "../../../hooks/useTokenDecimals";
import { findTokenByAddress } from "../../../utils";
import { formatUnits } from "viem";

type Props = {
  chainId: RoutesSupportedChainId;
  token: {
    token: string;
    amount: string;
  };
}

export function TokenDisplay({ chainId, token }: Props) {
  const { data: tokenDecimals } = useTokenDecimals(chainId, token.token);
  if (!tokenDecimals) return null;
  return (
    <li key={token.token} className="ml-4">{formatUnits(BigInt(token.amount), tokenDecimals)} {findTokenByAddress(chainId, token.token)?.id}</li>
  );
}