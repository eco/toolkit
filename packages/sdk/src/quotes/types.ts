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
            intentData: IntentData
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
          permitData: {
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
                      name: string
                      version: string
                      chainId: number
                      verifyingContract: Hex
                      nonce: string
                      deadline: string
                    }
                    spender: Hex
                    sigDeadline: string
                  }
                }
              } | {
                batchPermitData: {
                  typedData: {
                    details: {
                      name: string
                      version: string
                      chainId: number
                      verifyingContract: Hex
                      nonce: string
                      deadline: string
                    }[]
                    spender: Hex
                    sigDeadline: string
                  }
                }
              }
              signature: Hex
            }
          }
          allowPartial?: boolean
        }
      }
    }
    export interface Response {
      data: {
        // TODO: return acutal structure when it is decided
        transactionHash: Hex
      }
    }
  }
}

export type RequestQuotesForIntentParams = {
  intent: IntentType
  intentExecutionTypes?: IntentExecutionType[]
}

export type SubmitGaslessIntentParams = {
  funder: Hex
  intent: IntentType
  solverID: string
  permitData: PermitData
}

export type SolverQuote = {
  solverID: string
  quoteData: {
    quoteEntries: QuoteData[]
  }
}

export type QuoteData = {
  intentExecutionType: IntentExecutionType
  intentData: IntentType
  expiryTime: bigint // seconds since epoch
}

export type PermitData = Permit1 & Permit2

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
    permitData: SinglePermit2Data & BatchPermit2Data
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
  name: string
  version: string
  chainId: number
  verifyingContract: Hex
  nonce: bigint
  deadline: bigint
}

// TODO: return acutal structure when it is decided
export type InitiateGaslessIntentResponse = {
  transactionHash: Hex
}