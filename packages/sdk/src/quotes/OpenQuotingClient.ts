import axios, { AxiosInstance } from "axios";
import { OpenQuotingAPI, SolverQuote } from "./types";
import { ECO_SDK_CONFIG } from "../config";
import { IntentType } from "@eco-foundation/routes-ts";

export class OpenQuotingClient {
  private dAppID: string;
  private axiosInstance: AxiosInstance

  constructor({ dAppID, customBaseUrl }: { dAppID: string, customBaseUrl?: string }) {
    this.dAppID = dAppID;
    this.axiosInstance = axios.create({
      baseURL: customBaseUrl || ECO_SDK_CONFIG.openQuotingBaseUrl
    });
  }

  /**
   * Requests quotes for a given intent.
   *
   * @param intent - The intent for which quotes are being requested.
   * @returns A promise that resolves to an `OpenQuotingClient_ApiResponse_Quotes` object containing the quotes.
   * @throws An error if the request fails.
   *
   * @remarks
   * This method sends a POST request to the `/api/v1/quotes` endpoint with the provided intent information.
   */
  async requestQuotesForIntent(intent: IntentType): Promise<SolverQuote[]> {
    const payload: OpenQuotingAPI.Quotes.Request = {
      dAppID: this.dAppID,
      intent: {
        routeData: {
          originChainID: intent.route.source.toString(),
          destinationChainID: intent.route.destination.toString(),
          inboxContract: intent.route.inbox,
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
    return response.data.data;
  }
}
