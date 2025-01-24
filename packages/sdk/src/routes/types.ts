import { Hex } from "viem"
import { ChainId } from "../constants/types"

export type CreateSimpleRouteParams = {
  originChainID: ChainId
  destinationChainID: ChainId
  receivingToken: Hex
  spendingToken: Hex
  amount: bigint
  prover?: "HyperProver" | "StorageProver"
  simpleRouteActionData: Hex
  expiryTime?: Date
}

export type CreateRouteParams = {
  originChainID: ChainId
  destinationChainID: ChainId
  targetTokens: Hex[]
  rewardTokens: Hex[]
  rewardTokenBalances: bigint[]
  prover: "HyperProver" | "StorageProver" | Hex
  destinationChainActions: Hex[]
  expiryTime?: Date
}
