import { hexToNumber, slice } from 'viem'
import type { Hex, WalletClient } from 'viem'
import { Permit2DataDetails } from '../src'

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

export type SignPermit2Props = {
  chainId: number
  expiration: bigint
  spender: Hex
  details: Permit2DataDetails[]
}

/**
 * Signs a permit for a given ERC-2612 ERC20 token using the specified parameters.
 *
 * @param {WalletClient} walletClient - Wallet client to invoke for signing the permit message
 * @param {SignPermitProps} props - The properties required to sign the permit.
 * @param {string} props.contractAddress - The address of the ERC20 token contract.
 * @param {string} props.erc20Name - The name of the ERC20 token.
 * @param {number} props.value - The amount of the ERC20 to approve.
 * @param {string} props.ownerAddress - The address of the token holder.
 * @param {string} props.spenderAddress - The address of the token spender.
 * @param {number} props.deadline - The permit expiration timestamp in seconds.
 * @param {number} props.nonce - The nonce of the address on the specified ERC20.
 * @param {number} props.chainId - The chain ID for which the permit will be valid.
 * @param {number} props.permitVersion - The version of the permit (optional, defaults to "1").
 */
export const signPermit = async (
  walletClient: WalletClient,
  {
    contractAddress,
    erc20Name,
    ownerAddress,
    spenderAddress,
    value,
    deadline,
    nonce,
    chainId,
    permitVersion,
  }: SignPermitProps,
): Promise<Hex> => {
  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  }

  const domainData = {
    name: erc20Name,
    /** We assume 1 if permit version is not specified */
    version: permitVersion ?? '1',
    chainId: chainId,
    verifyingContract: contractAddress,
  }

  const message = {
    owner: ownerAddress,
    spender: spenderAddress,
    value,
    nonce,
    deadline,
  }
  const response = await walletClient.account!.signTypedData!({
    message,
    domain: domainData,
    primaryType: 'Permit',
    types,
  })

  return response
}

export const PERMIT2_ADDRESS: Hex = '0x000000000022D473030F116dDEE9F6B43aC78BA3'

export async function signPermit2(
  walletClient: WalletClient,
  {
    chainId,
    expiration,
    spender,
    details,
  }: SignPermit2Props,
): Promise<Hex> {
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
  }

  const domainData = {
    name: "Permit2",
    chainId: chainId,
    verifyingContract: PERMIT2_ADDRESS,
  }

  const message = {
    details: details.length > 1 ? details : details[0],
    spender,
    sigDeadline: expiration,
  }

  return walletClient.account!.signTypedData!({
    message,
    domain: domainData,
    primaryType: details.length > 1 ? 'PermitBatch' : 'PermitSingle',
    types,
  })
}

export function splitSignature(signature: Hex) {
  const [r, s, v] = [
    slice(signature, 0, 32),
    slice(signature, 32, 64),
    slice(signature, 64, 65),
  ]
  return { r, s, v: hexToNumber(v) }
}
