import { IntentType } from "@eco-foundation/routes-ts";
import { Hex } from "viem";
import { IntentExecutionType } from "../constants";
export namespace OpenQuotingAPI {
  export enum Endpoints {
    Quotes = '/api/v1/quotes',
    InitiateGaslessIntent = '/api/v1/quotes/initiateGaslessIntent',
  }

  export namespace Quotes {
    export type IntentData = {
      routeData: {
        originChainID: string
        destinationChainID: string
        inboxContract: Hex
        tokens: {
          token: Hex
          amount: string
        }[]
        calls: {
          target: Hex
          data: Hex
          value: string
        }[]
      },
      rewardData: {
        creator: Hex
        proverContract: Hex
        deadline: string
        nativeValue: string
        tokens: {
          token: Hex
          amount: string
        }[]
      }
    }
    export interface Request {
      dAppID: string;
      intentExecutionTypes: IntentExecutionType[];
      intentData: IntentData
    }
    export interface Response {
      data: {
        solverID: string
        quoteData: {
          quoteEntries: {
            intentExecutionType: IntentExecutionType
            tokens: {
              token: Hex
              amount: string
            }[]
            expiryTime: string
          }[]
        }
      }[]
    }
  }

  export namespace InitiateGaslessIntent {
    export interface Request {
      dAppID: string;
      solverID: string;
      intentData: Quotes.IntentData & {
        gaslessIntentData: {
          funder: Hex
          permitContract: Hex
          allowPartial?: boolean
          // TODO: add in optional permit2 signature data
        }
      }
    }
    export interface Response {
      data: {} // TODO: get response format
    }
  }
}

export type RequestQuotesForIntentParams = {
  intent: IntentType
  intentExecutionTypes?: IntentExecutionType[]
}

export type SolverQuote = {
  solverID: string
  quoteData: {
    quoteEntries: QuoteData[]
  }
}

export type QuoteData = {
  intentExecutionType: IntentExecutionType
  tokens: {
    token: Hex,
    amount: bigint
  }[]
  expiryTime: bigint // seconds since epoch
}
