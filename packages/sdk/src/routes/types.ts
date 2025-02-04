import { Hex } from "viem"
import { RoutesSupportedChainId } from "../constants"
import { SolverQuote } from "../quotes/types"
import { IntentType } from "@eco-foundation/routes-ts"

export type CreateSimpleIntentParams = {
  creator: Hex
  originChainID: RoutesSupportedChainId
  destinationChainID: RoutesSupportedChainId
  receivingToken: Hex
  spendingToken: Hex
  amount: bigint
  prover?: "HyperProver" | "StorageProver"
  recipient?: Hex
  expiryTime?: Date
}

export type CreateRouteParams = {
  creator: Hex
  originChainID: RoutesSupportedChainId
  destinationChainID: RoutesSupportedChainId
  calls: IntentCall[]
  tokens: IntentToken[]
  prover: "HyperProver" | "StorageProver" | Hex
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