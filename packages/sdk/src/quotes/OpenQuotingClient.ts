import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import { InitiateGaslessIntentResponse, OpenQuotingAPI, PermitData, RequestQuotesForIntentParams, SolverQuote, SubmitGaslessIntentParams } from "./types";
import { ECO_SDK_CONFIG } from "../config";
import { IntentType } from "@eco-foundation/routes-ts";
import { decodeFunctionData, erc20Abi } from "viem";

export class OpenQuotingClient {
  private readonly MAX_RETRIES = 5;
  private dAppID: string;
  private axiosInstance: AxiosInstance

  constructor({ dAppID, customBaseUrl }: { dAppID: string, customBaseUrl?: string }) {
    this.dAppID = dAppID;
    this.axiosInstance = axios.create({
      baseURL: customBaseUrl || ECO_SDK_CONFIG.openQuotingBaseUrl
    });
    axiosRetry(this.axiosInstance, { retries: this.MAX_RETRIES, retryDelay: axiosRetry.linearDelay(1000) });
  }

  /**
   * Requests quotes for a given intent.
   *
   * @param intent - The intent for which quotes are being requested.
   * @param intentExecutionTypes - The types of intent execution for which quotes are being requested.
   * @returns A promise that resolves to an `OpenQuotingClient_ApiResponse_Quotes` object containing the quotes.
   * @throws An error if multiple requests fail.
   *
   * @remarks
   * This method sends a POST request to the `/api/v1/quotes` endpoint with the provided intent information.
   * This will return quotes with the fee added to the reward tokens.
   */
  async requestQuotesForIntent({ intent, intentExecutionTypes = ['SELF_PUBLISH', 'GASLESS'] }: RequestQuotesForIntentParams): Promise<SolverQuote[]> {
    if (intentExecutionTypes.length === 0) {
      throw new Error("intentExecutionTypes must not be empty");
    }
    const payload: OpenQuotingAPI.Quotes.Request = {
      dAppID: this.dAppID,
      intentExecutionTypes,
      intentData: this.formatIntentData(intent)
    }

    const response = await this.axiosInstance.post<OpenQuotingAPI.Quotes.Response>(OpenQuotingAPI.Endpoints.Quotes, payload);

    return this.parseQuotesResponse(response.data);
  }

  /**
   * Requests reverse quotes for a given intent.
   * 
   * @param intent - The intent for which quotes are being requested.
   * @param intentExecutionTypes - The types of intent execution for which quotes are being requested.
   * @returns A promise that resolves to an array of `SolverQuote` objects containing the quotes.
   * @throws An error if multiple requests fail.
   * 
   * @remarks
   * This method sends a POST request to the `/api/v1/quotes` endpoint with the provided intent information.
   * This will return quotes with the fee subtracted from the route tokens and calls
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

    const response = await this.axiosInstance.post<OpenQuotingAPI.Quotes.Response>(OpenQuotingAPI.Endpoints.Quotes, payload);

    return this.parseQuotesResponse(response.data);
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

  private parseQuotesResponse(response: OpenQuotingAPI.Quotes.Response): SolverQuote[] {
    return response.data.map((quote) => ({
      solverID: quote.solverID,
      quoteData: {
        quoteEntries: quote.quoteData.quoteEntries.map((entry) => ({
          intentExecutionType: entry.intentExecutionType,
          intentData: {
            route: {
              salt: entry.intentData.routeData.salt,
              source: BigInt(entry.intentData.routeData.originChainID),
              destination: BigInt(entry.intentData.routeData.destinationChainID),
              inbox: entry.intentData.routeData.inboxContract,
              tokens: entry.intentData.routeData.tokens.map((token) => ({
                token: token.token,
                amount: BigInt(token.amount)
              })),
              calls: entry.intentData.routeData.calls.map((call) => ({
                target: call.target,
                data: call.data,
                value: BigInt(call.value)
              }))
            },
            reward: {
              creator: entry.intentData.rewardData.creator,
              prover: entry.intentData.rewardData.proverContract,
              deadline: BigInt(entry.intentData.rewardData.deadline),
              nativeValue: BigInt(entry.intentData.rewardData.nativeValue),
              tokens: entry.intentData.rewardData.tokens.map((token) => ({
                token: token.token,
                amount: BigInt(token.amount)
              }))
            }
          },
          expiryTime: BigInt(entry.expiryTime)
        }))
      }
    }));
  }

  /**
   * Submits a gasless intent to the Open Quoting service.
   *  
   * @param intent - The intent for which quotes are being requested.
   * @param solverID - The ID of the solver that is submitting the intent.
   * @returns A promise that resolves to the response from the Open Quoting service.
   * 
   * @remarks
   * This method sends a POST request to the `/api/v1/quotes/initiateGaslessIntent` endpoint with the provided intent information.
   */
  async submitGaslessIntent({ funder, intent, solverID, permitData }: SubmitGaslessIntentParams): Promise<InitiateGaslessIntentResponse> {
    const payload: OpenQuotingAPI.InitiateGaslessIntent.Request = {
      dAppID: this.dAppID,
      solverID,
      intentData: {
        ...this.formatIntentData(intent),
        gaslessIntentData: {
          funder,
          permitData: this.formatPermitData(permitData),
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
    if (permit.permit) {
      const permitData: Pick<PermitData, 'permit'> = permit;
      return {
        permit: permitData.permit.map((permit1) => ({
          token: permit1.token,
          data: {
            signature: permit1.data.signature,
            deadline: permit1.data.deadline.toString(),
          }
        }))
      }
    }
    else {
      const permitData: Pick<PermitData, 'permit2'> = permit;
      return {
        permit2: {
          permitContract: permitData.permit2.permitContract,
          permitData: permitData.permit2.permitData.singlePermitData ? {
            singlePermitData: {
              typedData: {
                details: {
                  name: permitData.permit2.permitData.singlePermitData.typedData.details.name,
                  version: permitData.permit2.permitData.singlePermitData.typedData.details.version,
                  chainId: permitData.permit2.permitData.singlePermitData.typedData.details.chainId,
                  verifyingContract: permitData.permit2.permitData.singlePermitData.typedData.details.verifyingContract,
                  nonce: permitData.permit2.permitData.singlePermitData.typedData.details.nonce.toString(),
                  deadline: permitData.permit2.permitData.singlePermitData.typedData.details.deadline.toString(),
                },
                spender: permitData.permit2.permitData.singlePermitData.typedData.spender,
                sigDeadline: permitData.permit2.permitData.singlePermitData.typedData.sigDeadline.toString(),
              }
            }
          } : {
            batchPermitData: {
              typedData: {
                details: permitData.permit2.permitData.batchPermitData.typedData.details.map((detail) => ({
                  name: detail.name,
                  version: detail.version,
                  chainId: detail.chainId,
                  verifyingContract: detail.verifyingContract,
                  nonce: detail.nonce.toString(),
                  deadline: detail.deadline.toString(),
                })),
                spender: permitData.permit2.permitData.batchPermitData.typedData.spender,
                sigDeadline: permitData.permit2.permitData.batchPermitData.typedData.sigDeadline.toString(),
              }
            }
          },
          signature: permitData.permit2.signature,
        }
      }
    }
  }
}
