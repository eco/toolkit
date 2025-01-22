import { getSecondsFromNow } from "../utils";
import { NetworkTokens } from "./constants";
import { ChainId, CreateRouteParams, CreateSimpleRouteParams, Route, Token } from "./types";

import { EcoChainIds, EcoProtocolAddresses } from "@eco-foundation/routes";

export class RoutesService {
  private isPreprod: boolean;

  constructor({ isPreprod }: { isPreprod?: boolean } = {}) {
    this.isPreprod = isPreprod || false;
  }

  /**
   * Creates a simple route.
   *
   * @param {CreateSimpleRouteParams} params - The parameters for creating the simple route.
   * 
   * @returns {Route} The created route.
   * 
   * @throws {Error} If the expiry time is in the past or the amount is invalid.
   */

  createSimpleRoute(params: CreateSimpleRouteParams): Route {
    const {
      originChainID,
      destinationChainID,
      acquiringToken,
      spendingToken,
      amount,
      prover = "HyperProver",
      simpleRouteActionData,
      expiryTime
    } = params;
    // validate
    if (params.expiryTime && params.expiryTime < getSecondsFromNow(60)) {
      throw new Error("Expiry time must be 60 seconds or more in the future");
    }
    if (amount < BigInt(0)) {
      throw new Error("Invalid amount");
    }

    const targetToken = RoutesService.getNetworkTokenAddress(originChainID, acquiringToken);
    const rewardToken = RoutesService.getNetworkTokenAddress(destinationChainID, spendingToken);

    return {
      originChainID,
      destinationChainID,
      targetTokens: [targetToken],
      rewardTokens: [rewardToken],
      rewardTokenBalances: [amount],
      proverContract: this.getProverContract(prover, originChainID),
      destinationChainActions: [simpleRouteActionData],
      expiryTime: expiryTime || getSecondsFromNow(2 * 60 * 60) // 2 hours from now
    }
  }

  /**
   * Creates a route.
   *
   * @param {CreateRouteParams} params - The parameters for creating the route.
   * 
   * @returns {Route} The created route.
   * 
   * @throws {Error} If the parameters, expiry time, reward token balances or tokens are invalid.
   */
  createRoute(params: CreateRouteParams): Route {
    // validate params
    if (params.targetTokens.length === 0 || params.rewardTokens.length === 0 || params.rewardTokenBalances.length === 0 || params.destinationChainActions.length === 0) {
      throw new Error("Invalid route parameters");
    }
    if (params.expiryTime && params.expiryTime < getSecondsFromNow(60)) {
      throw new Error("Expiry time must be 60 seconds or more in the future");
    }
    if (params.rewardTokenBalances.some((balance) => balance < BigInt(0))) {
      throw new Error("Invalid reward token balance");
    }

    // validate tokens
    const targetTokens = params.targetTokens.map((targetToken) => RoutesService.validateNetworkTokenAddress(params.destinationChainID, targetToken))
    const rewardTokens = params.rewardTokens.map((rewardToken) => RoutesService.validateNetworkTokenAddress(params.originChainID, rewardToken))

    return {
      originChainID: params.originChainID,
      destinationChainID: params.destinationChainID,
      targetTokens,
      rewardTokens,
      rewardTokenBalances: params.rewardTokenBalances,
      proverContract: this.getProverContract(params.prover, params.originChainID),
      destinationChainActions: params.destinationChainActions,
      expiryTime: params.expiryTime || getSecondsFromNow(2 * 60 * 60) // 2 hours from now
    }
  }

  private getProverContract(prover: "HyperProver" | "Prover" | Hex, chainID: ChainId): Hex {
    let proverContract: Hex;
    const ecoChainID: EcoChainIds = `${chainID}${this.isPreprod ? "-pre" : ""}`;
    switch (prover) {
      case "HyperProver": {
        proverContract = EcoProtocolAddresses[ecoChainID].HyperProver;
        break;
      }
      case "Prover": {
        const defaultProver = EcoProtocolAddresses[ecoChainID].Prover;
        if (!defaultProver) {
          throw new Error("No default prover found for this chain");
        }
        proverContract = defaultProver;
        break;
      }
      default: {
        proverContract = prover;
      }
    }
    return proverContract;
  }

  static getNetworkTokenAddress(chainID: ChainId, token: Token): Hex {
    const networkToken = NetworkTokens[chainID][token];
    if (!networkToken) {
      throw new Error(`Token ${token} not found on chain ${chainID}`);
    }
    return networkToken;
  }

  static validateNetworkTokenAddress(chainID: ChainId, address: Hex) {
    const isValidToken = Object.values(NetworkTokens[chainID]).some((token) => token === address);
    if (!isValidToken) {
      throw new Error(`Invalid Token Address ${address} on chainId ${chainID}`);
    }
    return address;
  }
}
