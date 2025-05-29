import { Hex } from "viem"
import { RoutesSupportedChainId } from "../constants.js"
import { SolverQuote } from "../quotes/types.js"
import { IntentType } from "@eco-foundation/routes-ts"

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
  nativeValue?: bigint
}

export type CreateNativeSendIntentParams = {
  creator: Hex
  originChainID: RoutesSupportedChainId
  destinationChainID: RoutesSupportedChainId
  amount: bigint
  limit: bigint
  recipient?: Hex
  prover?: "HyperProver" | "StorageProver"
  expiryTime?: Date
}

export type ApplyQuoteToIntentParams = {
  intent: IntentType
  quote: SolverQuote
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