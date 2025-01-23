import axios, { AxiosInstance } from "axios";
import { OpenQuotingAPI, SolverQuote } from "./types";
import { Route } from "../routes/types";
import { ECO_SDK_CONFIG } from "../config";
import { dateToTimestamp } from "../utils";

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
   * Requests quotes for a given route.
   *
   * @param route - The route for which quotes are being requested.
   * @returns A promise that resolves to an `OpenQuotingClient_ApiResponse_Quotes` object containing the quotes.
   * @throws An error if the request fails.
   *
   * @remarks
   * This method sends a POST request to the `/api/v1/quotes` endpoint with the provided route information.
   */
  async requestQuotesForRoute(route: Route): Promise<SolverQuote[]> {
    const payload: OpenQuotingAPI.Quotes.Request = {
      dAppID: this.dAppID,
      intentData: {
        originChainID: route.originChainID.toString(),
        destinationChainID: route.destinationChainID.toString(),
        targetTokens: route.targetTokens,
        rewardTokens: route.rewardTokens,
        rewardTokenBalances: route.rewardTokenBalances.map((amount) => amount.toString()),
        proverContract: route.proverContract,
        destinationChainActions: route.destinationChainActions,
        expiryTime: dateToTimestamp(route.expiryTime).toString()
      }
    }

    const response = await this.axiosInstance.post<OpenQuotingAPI.Quotes.Response>(OpenQuotingAPI.Endpoints.Quotes, payload);
    return response.data.data;
  }
}
