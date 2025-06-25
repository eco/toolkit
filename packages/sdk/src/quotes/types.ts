import { IntentType } from "@eco-foundation/routes-ts";
import { Hex, TransactionReceipt } from "viem";
import { IntentExecutionType } from "../constants.js";
export namespace OpenQuotingAPI {
  export enum Endpoints {
    Quotes = '/api/v2/quotes',
    ReverseQuotes = '/api/v2/quotes/reverse',
    InitiateGaslessIntent = '/api/v2/quotes/initiateGaslessIntent',
  }

  export namespace Quotes {
    export type IntentData = {
      routeData: {
        salt: Hex
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
        quoteID: string
        solverID: string
        quoteData: {
          quoteEntries: {
            intentExecutionType: IntentExecutionType
            routeTokens: {
              token: Hex
              amount: string
            }[]
            routeCalls: {
              target: Hex
              data: Hex
              value: string
            }[]
            rewardTokens: {
              token: Hex
              amount: string
            }[]
            expiryTime: string
            estimatedFulfillTimeSec: number
          }[]
        }
      }[]
    }
  }

  export namespace InitiateGaslessIntent {
    export interface Request {
      quoteID: string;
      dAppID: string;
      solverID: string;
      intentData: Quotes.IntentData & {
        gaslessIntentData: {
          funder: Hex
          vaultAddress: Hex
          allowPartial?: boolean
          permitData?: {
            permit: {
              token: Hex
              data: {
                signature: Hex
                deadline: string
              }
            }[]
          } | {
            permit2: {
              permitContract: Hex
              permitData: {
                singlePermitData: {
                  typedData: {
                    details: {
                      token: Hex
                      amount: string
                      expiration: string
                      nonce: string
                    }
                    spender: Hex
                    sigDeadline: string
                  }
                }
              } | {
                batchPermitData: {
                  typedData: {
                    details: {
                      token: Hex
                      amount: string
                      expiration: string
                      nonce: string
                    }[]
                    spender: Hex
                    sigDeadline: string
                  }
                }
              }
              signature: Hex
            }
          }
        }
      }
    }
    export interface Response {
      data: TransactionReceipt
    }
  }
}

export type RequestQuotesForIntentParams = {
  intent: IntentType
  intentExecutionTypes?: IntentExecutionType[]
}

export type InitiateGaslessIntentParams = {
  funder: Hex
  intent: IntentType
  vaultAddress: Hex
  quoteID: string
  solverID: string
  permitData?: PermitData
}

export type SolverQuote = {
  quoteID: string
  solverID: string
  quoteData: {
    quoteEntries: QuoteData[]
  }
}

export type QuoteData = {
  intentExecutionType: IntentExecutionType
  intentData: IntentType
  expiryTime: bigint // seconds since epoch
  estimatedFulfillTimeSec: number
}

export type QuoteSelectorOptions = {
  isReverse?: boolean;
  allowedIntentExecutionTypes?: IntentExecutionType[];
}

export type QuoteSelectorResult = {
  quoteID: string;
  solverID: string;
  quote: QuoteData;
}

export type PermitData = Permit1 | Permit2

export type Permit1 = {
  permit: {
    token: Hex
    data: {
      signature: Hex
      deadline: bigint
    }
  }[]
}

export type Permit2 = {
  permit2: {
    permitContract: Hex
    permitData: SinglePermit2Data | BatchPermit2Data
    signature: Hex
  }
}

export type SinglePermit2Data = {
  singlePermitData: {
    typedData: {
      details: Permit2DataDetails
      spender: Hex
      sigDeadline: bigint
    }
  }
}

export type BatchPermit2Data = {
  batchPermitData: {
    typedData: {
      details: Permit2DataDetails[]
      spender: Hex
      sigDeadline: bigint
    }
  }
}

export type Permit2DataDetails = {
  token: Hex
  amount: bigint
  expiration: bigint
  nonce: bigint
}

export type InitiateGaslessIntentResponse = {
  transactionHash: Hex
}