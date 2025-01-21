import { NetworkTokens } from "./constants.js";
import { ChainId, CreateSimpleRouteParams, Route, Token } from "./types.js";

import { EcoChainIds, EcoProtocolAddresses } from "@eco-foundation/routes";

export class RoutesService {
  private isPreprod: boolean;

  constructor({ isPreprod }: { isPreprod?: boolean } = {}) {
    this.isPreprod = isPreprod || false;
  }

  /**
   * Creates a simple route.
   *
   * @param {CreateSimpleRouteParams} params - The parameters for creating the route.
   * 
   * @returns {Route} The created route.
   * 
   * @throws {Error} If no default prover is found for the specified chain.
   */
  createSimpleRoute(params: CreateSimpleRouteParams): Route {
    // validate params
    if (params.targetTokens.length === 0 || params.rewardTokens.length === 0 || params.rewardTokenBalances.length === 0 || params.destinationChainActions.length === 0) {
      throw new Error("Invalid route parameters");
    }
    if (params.expiryTime && params.expiryTime < new Date()) {
      throw new Error("Expiry time must be in the future");
    }

    const originEcoChainID: EcoChainIds = `${params.originChainID}${this.isPreprod ? "-pre" : ""}`;
    let proverContract: Hex;
    switch (params.prover) {
      case "HyperProver": {
        proverContract = EcoProtocolAddresses[originEcoChainID].HyperProver;
        break;
      }
      case "Prover": {
        const defaultProver = EcoProtocolAddresses[originEcoChainID].Prover;
        if (!defaultProver) {
          throw new Error("No default prover found for this chain");
        }
        proverContract = defaultProver;
        break;
      }
      default: {
        proverContract = params.prover;
      }
    }

    const targetTokens = params.targetTokens.map((targetToken) => RoutesService.getNetworkTokenAddress(params.destinationChainID, targetToken));
    const rewardTokens = params.rewardTokens.map((rewardToken) => RoutesService.getNetworkTokenAddress(params.originChainID, rewardToken));

    return {
      originChainID: params.originChainID,
      destinationChainID: params.destinationChainID,
      targetTokens,
      rewardTokens,
      rewardTokenBalances: params.rewardTokenBalances.map((amount) => amount.toString()),
      proverContract,
      destinationChainActions: params.destinationChainActions,
      expiryTime: params.expiryTime || new Date(Date.now() + (1000 * 60 * 60 * 2)) // 2 hours from now
    }
  }

  static getNetworkTokenAddress(chainID: ChainId, token: Token): Hex {
    const networkToken = NetworkTokens[chainID][token];
    if (!networkToken) {
      throw new Error(`Token ${token} not found on chain ${chainID}`);
    }
    return networkToken;
  }
}
