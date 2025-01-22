import axios, { AxiosInstance } from "axios";
import { OpenQuotingClient_ApiRequest_Quotes, OpenQuotingClient_ApiResponse_Quotes } from "./types";
import { Route } from "../routes/types";

export class OpenQuotingClient {
  private dAppID: string;
  private readonly openQuotingBaseUrl = "https://aleph2035.ngrok.io"; // TODO: once deployed, change this to the actual URL
  private axiosInstance: AxiosInstance

  constructor({ dAppID, customBaseUrl }: { dAppID: string, customBaseUrl?: string }) {
    this.dAppID = dAppID;
    this.axiosInstance = axios.create({
      baseURL: customBaseUrl || this.openQuotingBaseUrl
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
  async requestQuotesForRoute(route: Route): Promise<OpenQuotingClient_ApiResponse_Quotes> {
    const payload: OpenQuotingClient_ApiRequest_Quotes = {
      dAppID: this.dAppID,
      intentData: {
        originChainID: route.originChainID.toString(),
        destinationChainID: route.destinationChainID.toString(),
        targetTokens: route.targetTokens,
        rewardTokens: route.rewardTokens,
        rewardTokenBalances: route.rewardTokenBalances.map((amount) => amount.toString()),
        proverContract: route.proverContract,
        destinationChainActions: route.destinationChainActions,
        expiryTime: Math.floor(route.expiryTime.getTime() / 1000).toString()
      }
    }

    const response = await this.axiosInstance.post<OpenQuotingClient_ApiResponse_Quotes>("/api/v1/quotes", payload);
    return response.data;
  }
}
