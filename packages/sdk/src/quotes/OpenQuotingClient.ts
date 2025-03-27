import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import { OpenQuotingAPI, RequestQuotesForIntentParams, SolverQuote } from "./types";
import { ECO_SDK_CONFIG } from "../config";

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
   * @returns A promise that resolves to an `OpenQuotingClient_ApiResponse_Quotes` object containing the quotes.
   * @throws An error if multiple requests fail.
   *
   * @remarks
   * This method sends a POST request to the `/api/v1/quotes` endpoint with the provided intent information.
   */
  async requestQuotesForIntent({ intent, intentExecutionTypes = ['SELF_PUBLISH', 'GASLESS'] }: RequestQuotesForIntentParams): Promise<SolverQuote[]> {
    if (intentExecutionTypes.length === 0) {
      throw new Error("intentExecutionTypes must not be empty");
    }
    const payload: OpenQuotingAPI.Quotes.Request = {
      dAppID: this.dAppID,
      intentExecutionTypes,
      intentData: {
        routeData: {
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

    const response = await this.axiosInstance.post<OpenQuotingAPI.Quotes.Response>(OpenQuotingAPI.Endpoints.Quotes, payload);

    return this.parseQuotesResponse(response.data);
  }

  private parseQuotesResponse(response: OpenQuotingAPI.Quotes.Response): SolverQuote[] {
    return response.data.map((quote) => ({
      solverID: quote.solverID,
      quoteData: {
        quoteEntries: quote.quoteData.quoteEntries.map((entry) => ({
          intentExecutionType: entry.intentExecutionType,
          tokens: entry.tokens.map((token) => ({
            token: token.token,
            amount: BigInt(token.amount)
          })),
          expiryTime: BigInt(entry.expiryTime)
        }))
      }
    }));
  }

  // TODO: add method for submitting quoted intent gaslessly
  async submitGaslessIntent({ }: { intent: any, quote: any }): Promise<any> {
    throw new Error("Method not implemented");
  }
}
