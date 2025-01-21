export type OQEApiRequest_Quotes = {
  dAppID: string;
  intentData: {
    originChainID: string
    destinationChainID: string
    targetTokens: Hex[]
    rewardTokens: Hex[]
    rewardTokenBalances: string[]
    proverContract: Hex
    destinationChainActions: Hex[]
    expiryTime: string
  }
}

export type OQEApiResponse_Quotes = {
  data: SolverQuote[]
}

export type SolverQuote = {
  receiveSignedIntentUrl: string,
  intentSourceContract: Hex,
  quoteData: QuoteData
}

export type QuoteData = {
  rewardTokens: Hex[]
  rewardTokenAmounts: string[]
  expiryTime: string
}
