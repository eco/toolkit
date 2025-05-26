import { Hex } from "viem"
import { RoutesSupportedChainId } from "../constants.js"

export type CreateSimpleIntentParams = {
  creator: Hex
  originChainID: RoutesSupportedChainId
  destinationChainID: RoutesSupportedChainId
  receivingToken: Hex
  spendingToken: Hex
  spendingTokenLimit: bigint
  amount: bigint
  prover?: "HyperProver" | "StorageProver"
  recipient?: Hex
  expiryTime?: Date
}

export type CreateIntentParams = {
  creator: Hex
  originChainID: RoutesSupportedChainId
  destinationChainID: RoutesSupportedChainId
  calls: IntentCall[]
  callTokens: IntentToken[]
  tokens: IntentToken[]
  prover: "HyperProver" | "StorageProver" | Hex
  expiryTime?: Date
}

type IntentCall = {
  target: Hex
  data: Hex
  value: bigint
}

type IntentToken = {
  token: Hex
  amount: bigint
}