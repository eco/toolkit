export type ChainId = 10 | 5000 | 8453 | 42161

export type Token = "USDC" | "USDbC" | "USDCe" | "USDT"

export type Route = {
  originChainID: ChainId
  destinationChainID: ChainId
  targetTokens: Hex[]
  rewardTokens: Hex[]
  rewardTokenBalances: string[]
  proverContract: Hex
  destinationChainActions: Hex[]
  expiryTime: Date
}

export type CreateSimpleRouteParams = {
  originChainID: ChainId
  destinationChainID: ChainId
  acquiringToken: Token
  spendingToken: Token
  amount: bigint
  prover?: "HyperProver" | "Prover"
  simpleRouteActionData: Hex
  expiryTime?: Date
}

export type CreateRouteParams = {
  originChainID: ChainId
  destinationChainID: ChainId
  targetTokens: Hex[]
  rewardTokens: Hex[]
  rewardTokenBalances: bigint[]
  prover: "HyperProver" | "Prover" | Hex
  destinationChainActions: Hex[]
  expiryTime?: Date
}
