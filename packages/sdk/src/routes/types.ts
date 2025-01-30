import { Hex } from "viem"
import { RoutesSupportedChainId } from "../constants/types"
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
  simpleIntentActionData: SimpleIntentActionData
  expiryTime?: Date
}

export type SimpleIntentActionData = SimpleIntentActionData_Transfer | SimpleIntentActionData_TransferFrom

export type SimpleIntentActionData_Transfer = {
  functionName: 'transfer'
  recipient: Hex
}

export type SimpleIntentActionData_TransferFrom = {
  functionName: 'transferFrom'
  recipient: Hex
  sender: Hex
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