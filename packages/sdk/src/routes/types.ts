import { Hex } from "viem"
import { EcoChainIdsEnv, EcoProtocolAddresses } from "@eco-foundation/routes-ts"

export type CreateSimpleIntentParams = {
  creator: Hex
  originChainID: number
  destinationChainID: number
  receivingToken: Hex
  spendingToken: Hex
  spendingTokenLimit: bigint
  amount: bigint
  prover?: "HyperProver" | "MetaProver" | Hex
  recipient?: Hex
  expiryTime?: Date
}

export type CreateIntentParams = {
  creator: Hex
  originChainID: number
  destinationChainID: number
  calls: IntentCall[]
  callTokens: IntentToken[]
  tokens: IntentToken[]
  prover?: "HyperProver" | "MetaProver" | Hex
  expiryTime?: Date
  nativeValue?: bigint
}

export type CreateNativeSendIntentParams = {
  creator: Hex
  originChainID: number
  destinationChainID: number
  amount: bigint
  limit: bigint
  recipient?: Hex
  prover?: "HyperProver" | "MetaProver" | Hex
  expiryTime?: Date
}

export type EcoProtocolContract = keyof typeof EcoProtocolAddresses[EcoChainIdsEnv];

export type ProtocolAddresses = Record<string, Partial<Record<EcoProtocolContract, Hex>>>;

type IntentCall = {
  target: Hex
  data: Hex
  value: bigint
}

type IntentToken = {
  token: Hex
  amount: bigint
}
