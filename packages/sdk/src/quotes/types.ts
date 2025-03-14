import { IntentType } from "@eco-foundation/routes-ts";
import { Hex } from "viem";
import { IntentExecutionType } from "../constants";
export namespace OpenQuotingAPI {
  export enum Endpoints {
    Quotes = '/api/v1/quotes'
  }

  export namespace Quotes {
    export interface Request {
      dAppID: string;
      intentExecutionTypes: string[];
      intentData: {
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
    }
    export interface Response {
      data: SolverQuote[]
    }
  }
}

export type RequestQuotesForIntentParams = {
  intent: IntentType
  intentExecutionTypes?: IntentExecutionType[]
}

export type SolverQuote = {
  quoteData: QuoteData
}

export type QuoteData = {
  tokens: {
    token: Hex,
    amount: string
  }[]
  expiryTime: string // seconds since epoch
}
