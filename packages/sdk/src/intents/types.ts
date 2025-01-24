import { Hex } from "viem"
import { ChainId } from "../constants/types"
import { SolverQuote } from "../quotes/types"

export type SetupIntentForPublishingParams = {
  creator: Hex
  intentData: IntentData
  quote: SolverQuote
}

export type IntentData = {
  originChainID: ChainId
  destinationChainID: ChainId
  targetTokens: Hex[]
  rewardTokens: Hex[]
  rewardTokenBalances: bigint[]
  proverContract: Hex
  destinationChainActions: Hex[]
  expiryTime: Date
}
