import { Hex } from "viem"
import { ChainId } from "../constants/types"

export type SetupIntentForPublishingParams = {
  creator: Hex
  intentData: IntentData
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
