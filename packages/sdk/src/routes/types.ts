import { Hex } from "viem"
import { SolverQuote } from "../quotes/types"
import { EcoChainIds, IntentType } from "@eco-foundation/routes-ts"

export type CreateSimpleIntentParams = {
  creator: Hex
  originChainID: EcoChainIds
  destinationChainID: EcoChainIds
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
  originChainID: EcoChainIds
  destinationChainID: EcoChainIds
  calls: IntentCall[]
  callTokens: IntentToken[]
  tokens: IntentToken[]
  prover?: "HyperProver" | "MetaProver" | Hex
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