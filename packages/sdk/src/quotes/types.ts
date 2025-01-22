
export namespace OpenQuotingAPI {
  export enum Endpoints {
    Quotes = '/api/v1/quotes'
  }

  export type Interfaces = {
    [Endpoints.Quotes]: {
      Request: {
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
      Response: {
        data: SolverQuote[]
      }
    }
  }
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
