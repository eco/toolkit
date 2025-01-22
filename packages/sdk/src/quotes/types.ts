import { Hex } from "viem";
export namespace OpenQuotingAPI {
  export enum Endpoints {
    Quotes = '/api/v1/quotes'
  }

  export namespace Quotes {
    export interface Request {
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
    export interface Response {
      data: SolverQuote[]
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
