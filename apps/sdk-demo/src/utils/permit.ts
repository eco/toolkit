import { Hex } from "viem";
import { signTypedData } from "@wagmi/core";
import { config } from "../wagmi";
import { Permit2DataDetails } from "@eco-foundation/routes-sdk";
import { stableAddresses } from "@eco-foundation/routes-sdk";

// Global permit2 address (same across all chains)
export const PERMIT2_ADDRESS: Hex = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

/**
 * Checks if a token is USDC
 * @param address Token address
 * @returns Boolean indicating if token is USDC
 */
export function isUSDC(address: Hex): boolean {
  // Check against known USDC addresses by lowercase comparison
  const usdcAddresses = Object.values(stableAddresses)
    .map(tokens => tokens.USDC)
    .filter(Boolean)
    .map(addr => addr?.toLowerCase());

  return usdcAddresses.includes(address.toLowerCase());
}

/**
 * Signs a permit for a given ERC-2612 ERC20 token using wagmi's signTypedData
 */
export type SignPermitProps = {
  /** Address of the token to approve */
  contractAddress: Hex
  /** Name of the token to approve.
   * Corresponds to the `name` method on the ERC-20 contract. Please note this must match exactly byte-for-byte */
  erc20Name: string
  /** Owner of the tokens. Usually the currently connected address. */
  ownerAddress: Hex
  /** Address to grant allowance to */
  spenderAddress: Hex
  /** Expiration of this approval, in SECONDS */
  deadline: bigint
  /** Numerical chainId of the token contract */
  chainId: number
  /** Defaults to 1. Some tokens need a different version, check the [PERMIT INFORMATION](https://github.com/vacekj/wagmi-permit/blob/main/PERMIT.md) for more information */
  permitVersion?: string
  /** Permit nonce for the specific address and token contract. You can get the nonce from the `nonces` method on the token contract. */
  nonce: bigint
  /** Amount to approve */
  value: bigint
}

export async function signPermit({
  contractAddress,
  erc20Name,
  ownerAddress,
  spenderAddress,
  value,
  deadline,
  nonce,
  chainId,
  permitVersion = "1",
}: SignPermitProps): Promise<Hex> {
  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };

  const domainData = {
    name: erc20Name,
    version: permitVersion,
    chainId: chainId,
    verifyingContract: contractAddress,
  };

  const message = {
    owner: ownerAddress,
    spender: spenderAddress,
    value,
    nonce,
    deadline,
  };

  return signTypedData(config, {
    domain: domainData,
    message,
    primaryType: 'Permit',
    types,
  });
}

export type SignPermit2Props = {
  chainId: number
  expiration: bigint
  spender: Hex
  details: Permit2DataDetails[]
}

export async function signPermit2({
  chainId,
  expiration,
  spender,
  details,
}: SignPermit2Props): Promise<Hex> {
  const types = {
    PermitDetails: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint160' },
      { name: 'expiration', type: 'uint48' },
      { name: 'nonce', type: 'uint48' },
    ],
    PermitSingle: [
      { name: 'details', type: 'PermitDetails' },
      { name: 'spender', type: 'address' },
      { name: 'sigDeadline', type: 'uint256' },
    ],
    PermitBatch: [
      { name: 'details', type: 'PermitDetails[]' },
      { name: 'spender', type: 'address' },
      { name: 'sigDeadline', type: 'uint256' }
    ],
  };

  const domainData = {
    name: "Permit2",
    chainId: chainId,
    verifyingContract: PERMIT2_ADDRESS,
  };

  const message = {
    details: details.length > 1 ? details : details[0],
    spender,
    sigDeadline: expiration,
  };

  return signTypedData(config, {
    domain: domainData,
    message,
    primaryType: details.length > 1 ? 'PermitBatch' : 'PermitSingle',
    types,
  });
}
