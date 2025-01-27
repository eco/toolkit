import { Hex } from "viem"
import { RoutesSupportedChainId } from "../constants/types"
import { SolverQuote } from "../quotes/types"

export type CreateSimpleIntentParams = {
  originChainID: RoutesSupportedChainId
  destinationChainID: RoutesSupportedChainId
  receivingToken: Hex
  spendingToken: Hex
  amount: bigint
  prover?: "HyperProver" | "StorageProver"
  simpleIntentActionData: Hex
  expiryTime?: Date
}

export type CreateRouteParams = {
  originChainID: RoutesSupportedChainId
  destinationChainID: RoutesSupportedChainId
  targetTokens: Hex[]
  rewardTokens: Hex[]
  rewardTokenBalances: bigint[]
  prover: "HyperProver" | "StorageProver" | Hex
  destinationChainActions: Hex[]
  expiryTime?: Date
}

export type SetupIntentForPublishingParams = {
  creator: Hex
  intentData: IntentData
  quote?: SolverQuote
}

export type IntentData = {
  originChainID: RoutesSupportedChainId
  destinationChainID: RoutesSupportedChainId
  targetTokens: Hex[]
  rewardTokens: Hex[]
  rewardTokenBalances: bigint[]
  proverContract: Hex
  destinationChainActions: Hex[]
  expiryTime: Date
}
