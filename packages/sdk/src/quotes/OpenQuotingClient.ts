import axios, { AxiosInstance } from "axios";
import { BatchPermit2Data, InitiateGaslessIntentResponse, OpenQuotingAPI, Permit1, Permit2, PermitData, RequestQuotesForIntentParams, SinglePermit2Data, SolverQuote, InitiateGaslessIntentParams } from "./types.js";
import { decodeFunctionData, erc20Abi } from "viem";
import { ECO_SDK_CONFIG } from "../config.js";
import { IntentType } from "@eco-foundation/routes-ts";

export class OpenQuotingClient {
  private readonly MAX_RETRIES = 5;
  private dAppID: string;
  private axiosInstance: AxiosInstance

  constructor({ dAppID, customBaseUrl }: { dAppID: string, customBaseUrl?: string }) {
    this.dAppID = dAppID;
    this.axiosInstance = axios.create({
      baseURL: customBaseUrl || ECO_SDK_CONFIG.openQuotingBaseUrl
    });

    // import axios-retry in a way that supports esm and commonjs
    import('axios-retry').then(({ default: axiosRetry }) => {
      axiosRetry(this.axiosInstance, { retries: this.MAX_RETRIES, retryDelay: axiosRetry.linearDelay(1000) });
    }).catch(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const axiosRetry = require('axios-retry');
      axiosRetry(this.axiosInstance, { retries: this.MAX_RETRIES, retryDelay: axiosRetry.linearDelay(1000) });
    }).catch(() => {
      console.warn("Failed to import axios-retry, OpenQuotingClient requests will only be attempted once");
    });
  }

  /**
   * Requests quotes for a given intent.
   *
   * @param {RequestQuotesForIntentParams} params - The parameters for requesting quotes.
   * @param {IntentType} params.intent - The intent for which quotes are being requested.
   * @param {string[]} params.intentExecutionTypes - The types of intent execution for which quotes are being requested.
   * @returns {Promise<SolverQuote[]>} A promise that resolves to an array of SolverQuote objects containing the quotes.
   * @throws {Error} If intentExecutionTypes is empty or if the request fails after multiple retries.
   *
   * @remarks
   * This method sends a POST request to the `/api/v2/quotes` endpoint with the provided intent information.
   * The intentData returned in each quote will have the fee added to the reward tokens.
   */
  async requestQuotesForIntent({ intent, intentExecutionTypes = ['SELF_PUBLISH'] }: RequestQuotesForIntentParams): Promise<SolverQuote[]> {
    if (intentExecutionTypes.length === 0) {
      throw new Error("intentExecutionTypes must not be empty");
    }
    const payload: OpenQuotingAPI.Quotes.Request = {
      dAppID: this.dAppID,
      intentExecutionTypes,
      intentData: this.formatIntentData(intent)
    }
    payload.intentData.routeData.salt = "0x0";

    const response = await this.axiosInstance.post<OpenQuotingAPI.Quotes.Response>(OpenQuotingAPI.Endpoints.Quotes, payload);

    return this.parseQuotesResponse(intent, response.data);
  }

  /**
   * Requests reverse quotes for a given intent.
   * 
   * @param {RequestQuotesForIntentParams} params - The parameters for requesting reverse quotes.
   * @param {IntentType} params.intent - The intent for which quotes are being requested.
   * @param {string[]} params.intentExecutionTypes - The types of intent execution for which quotes are being requested.
   * @returns {Promise<SolverQuote[]>} A promise that resolves to an array of SolverQuote objects containing the quotes.
   * @throws {Error} If intentExecutionTypes is empty, if the calls aren't ERC20.transfer calls, or if the request fails after multiple retries.
   * 
   * @remarks
   * This method sends a POST request to the `/api/v2/quotes/reverse` endpoint with the provided intent information.
   * This intentData returned in each quote will have the fee subtracted from the route tokens and calls.
   */
  async requestReverseQuotesForIntent({ intent, intentExecutionTypes = ['SELF_PUBLISH', 'GASLESS'] }: RequestQuotesForIntentParams): Promise<SolverQuote[]> {
    if (intentExecutionTypes.length === 0) {
      throw new Error("intentExecutionTypes must not be empty");
    }
    if (intent.route.calls.some((call) => {
      try {
        const result = decodeFunctionData({ data: call.data, abi: erc20Abi });
        return result.functionName !== "transfer";
      }
      catch {
        return true;
      }
    })) {
      throw new Error("Reverse quote calls must be ERC20 transfer calls");
    }
    const payload: OpenQuotingAPI.Quotes.Request = {
      dAppID: this.dAppID,
      intentExecutionTypes,
      intentData: this.formatIntentData(intent)
    }
    payload.intentData.routeData.salt = "0x0";

    const response = await this.axiosInstance.post<OpenQuotingAPI.Quotes.Response>(OpenQuotingAPI.Endpoints.ReverseQuotes, payload);

    return this.parseQuotesResponse(intent, response.data);
  }

  private formatIntentData(intent: IntentType): OpenQuotingAPI.Quotes.IntentData {
    return {
      routeData: {
        salt: intent.route.salt,
        originChainID: intent.route.source.toString(),
        destinationChainID: intent.route.destination.toString(),
        inboxContract: intent.route.inbox,
        tokens: intent.route.tokens.map((token) => ({
          token: token.token,
          amount: token.amount.toString()
        })),
        calls: intent.route.calls.map((call) => ({
          target: call.target,
          data: call.data,
          value: call.value.toString()
        }))
      },
      rewardData: {
        creator: intent.reward.creator,
        proverContract: intent.reward.prover,
        deadline: intent.reward.deadline.toString(),
        nativeValue: intent.reward.nativeValue.toString(),
        tokens: intent.reward.tokens.map((token) => ({
          token: token.token,
          amount: token.amount.toString()
        }))
      }
    }
  }

  private parseQuotesResponse(intent: IntentType, response: OpenQuotingAPI.Quotes.Response): SolverQuote[] {
    return response.data.map((quote) => ({
      quoteID: quote.quoteID,
      solverID: quote.solverID,
      quoteData: {
        quoteEntries: quote.quoteData.quoteEntries.map((entry) => ({
          intentExecutionType: entry.intentExecutionType,
          intentData: {
            route: {
              salt: intent.route.salt,
              source: intent.route.source,
              destination: intent.route.destination,
              inbox: intent.route.inbox,
              tokens: entry.routeTokens.map((token) => ({
                token: token.token,
                amount: BigInt(token.amount)
              })),
              calls: entry.routeCalls.map((call) => ({
                target: call.target,
                data: call.data,
                value: BigInt(call.value)
              }))
            },
            reward: {
              creator: intent.reward.creator,
              prover: intent.reward.prover,
              deadline: intent.reward.deadline,
              nativeValue: intent.reward.nativeValue,
              tokens: entry.rewardTokens.map((token) => ({
                token: token.token,
                amount: BigInt(token.amount)
              }))
            }
          },
          expiryTime: BigInt(entry.expiryTime),
          estimatedFulfillTimeSec: entry.estimatedFulfillTimeSec
        }))
      }
    }));
  }

  /**
   * Initiates a gasless intent via the Open Quoting service.
   *  
   * @param {InitiateGaslessIntentParams} params - The parameters for initiating a gasless intent.
   * @param {string} params.funder - The address of the entity funding the intent execution.
   * @param {IntentType} params.intent - The intent to be executed gaslessly.
   * @param {string} params.quoteID - The ID of the quote selected for execution.
   * @param {string} params.solverID - The ID of the solver that is executing the intent.
   * @param {string} params.vaultAddress - The address of the vault to use for the gasless intent.
   * @param {PermitData} [params.permitData] - Optional permit data for token approvals.
   * @returns {Promise<InitiateGaslessIntentResponse>} A promise that resolves to the response from the Open Quoting service.
   * @throws {Error} If the request fails (no retries are attempted for this endpoint).
   * 
   * @remarks
   * This method sends a POST request to the `/api/v2/quotes/initiateGaslessIntent` endpoint with the provided intent information.
   */
  async initiateGaslessIntent({ funder, intent, quoteID, solverID, vaultAddress, permitData }: InitiateGaslessIntentParams): Promise<InitiateGaslessIntentResponse> {
    const payload: OpenQuotingAPI.InitiateGaslessIntent.Request = {
      dAppID: this.dAppID,
      quoteID,
      solverID,
      intentData: {
        ...this.formatIntentData(intent),
        gaslessIntentData: {
          funder,
          vaultAddress,
          permitData: permitData ? this.formatPermitData(permitData) : undefined,
        }
      }
    }

    const response = await this.axiosInstance.post<OpenQuotingAPI.InitiateGaslessIntent.Response>(OpenQuotingAPI.Endpoints.InitiateGaslessIntent, payload, {
      'axios-retry': {
        retries: 0
      }
    });

    return response.data.data;
  }

  private formatPermitData(permit: PermitData): OpenQuotingAPI.InitiateGaslessIntent.Request["intentData"]["gaslessIntentData"]["permitData"] {
    if ((permit as Permit1).permit) {
      // regular permit
      const permit1 = permit as Permit1;
      return {
        permit: permit1.permit.map((p) => ({
          token: p.token,
          data: {
            signature: p.data.signature,
            deadline: p.data.deadline.toString(),
          }
        }))
      }
    }
    else {
      const permit2 = permit as Permit2;
      if ((permit2.permit2.permitData as SinglePermit2Data).singlePermitData) {
        const permitData = permit2.permit2.permitData as SinglePermit2Data;
        return {
          permit2: {
            permitContract: permit2.permit2.permitContract,
            permitData: {
              singlePermitData: {
                typedData: {
                  details: {
                    token: permitData.singlePermitData.typedData.details.token,
                    amount: permitData.singlePermitData.typedData.details.amount.toString(),
                    expiration: permitData.singlePermitData.typedData.details.expiration.toString(),
                    nonce: permitData.singlePermitData.typedData.details.nonce.toString(),
                  },
                  spender: permitData.singlePermitData.typedData.spender,
                  sigDeadline: permitData.singlePermitData.typedData.sigDeadline.toString(),
                }
              }
            },
            signature: permit2.permit2.signature,
          }
        }
      }
      else {
        const permitData = permit2.permit2.permitData as BatchPermit2Data;
        return {
          permit2: {
            permitContract: permit2.permit2.permitContract,
            permitData: {
              batchPermitData: {
                typedData: {
                  details: permitData.batchPermitData.typedData.details.map((detail) => ({
                    token: detail.token,
                    amount: detail.amount.toString(),
                    expiration: detail.expiration.toString(),
                    nonce: detail.nonce.toString(),
                  })),
                  spender: permitData.batchPermitData.typedData.spender,
                  sigDeadline: permitData.batchPermitData.typedData.sigDeadline.toString(),
                }
              }
            },
            signature: permit2.permit2.signature,
          }
        }
      }

    }
  }
}
