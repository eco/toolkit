import { Hex, isAddress } from "viem";
import { dateToTimestamp, generateRandomHex, getSecondsFromNow, isAmountInvalid } from "../utils";
import { NetworkTokens } from "../constants";
import { CreateRouteParams, CreateSimpleIntentParams, SetupIntentForPublishingParams, IntentData } from "./types";
import { RoutesSupportedChainId, RoutesSupportedToken } from "../constants/types";

import { EcoChainIds, EcoProtocolAddresses, hashIntent } from "@eco-foundation/routes-ts";

export class RoutesService {
  private isPreprod: boolean;

  constructor({ isPreprod }: { isPreprod?: boolean } = {}) {
    this.isPreprod = isPreprod || false;
  }

  /**
   * Creates a simple route.
   *
   * @param {CreateSimpleIntentParams} params - The parameters for creating the simple route.
   * 
   * @returns {IntentData} The created intent data.
   * 
   * @throws {Error} If the expiry time is in the past or the amount is invalid.
   */

  createSimpleIntent({
    originChainID,
    destinationChainID,
    receivingToken,
    spendingToken,
    amount,
    prover = "HyperProver",
    simpleIntentActionData,
    expiryTime = getSecondsFromNow(60)
  }: CreateSimpleIntentParams): IntentData {
    // validate
    if (expiryTime < getSecondsFromNow(60)) {
      throw new Error("Expiry time must be 60 seconds or more in the future");
    }
    if (isAmountInvalid(amount)) {
      throw new Error("Invalid amount");
    }

    return {
      originChainID,
      destinationChainID,
      targetTokens: [receivingToken],
      rewardTokens: [spendingToken],
      rewardTokenBalances: [amount],
      proverContract: this.getProverContract(prover, originChainID),
      destinationChainActions: [simpleIntentActionData],
      expiryTime
    }
  }

  /**
   * Creates a route.
   *
   * @param {CreateRouteParams} params - The parameters for creating the route.
   * 
   * @returns {IntentData} The created intent data.
   * 
   * @throws {Error} If the parameters, expiry time, reward token balances or tokens are invalid.
   */
  createIntent({
    originChainID,
    destinationChainID,
    targetTokens,
    rewardTokens,
    rewardTokenBalances,
    prover = "HyperProver",
    destinationChainActions,
    expiryTime = getSecondsFromNow(2 * 60 * 60) // 2 hours from now
  }: CreateRouteParams): IntentData {
    // validate params
    if (!targetTokens.length || !rewardTokens.length || !rewardTokenBalances.length || !destinationChainActions.length) {
      throw new Error("Invalid route parameters");
    }
    if (expiryTime < getSecondsFromNow(60)) {
      throw new Error("Expiry time must be 60 seconds or more in the future");
    }
    if (rewardTokenBalances.some(isAmountInvalid)) {
      throw new Error("Invalid reward token balance");
    }

    return {
      originChainID,
      destinationChainID,
      targetTokens,
      rewardTokens,
      rewardTokenBalances,
      proverContract: this.getProverContract(prover, originChainID),
      destinationChainActions,
      expiryTime
    }
  }

  /**
   * Sets up an intent for publishing by validating the provided parameters and generating the necessary data structures.
   *
   * @param {SetupIntentForPublishingParams} params - The parameters required to set up the intent for publishing.
   *
   * @returns {object} An object containing the salt, routeHash, rewardHash, intentHash, and the intent itself.
   * 
   * @throws {Error} If the creator address is invalid.
   * @throws {Error} If the targetTokens and destinationChainActions arrays do not have the same length.
   * @throws {Error} If the rewardTokens and rewardTokenAmounts arrays do not have the same length.
   */
  setupIntentForPublishing({ creator, intentData, quote }: SetupIntentForPublishingParams) {
    // validate
    if (!isAddress(creator, { strict: false })) {
      throw new Error("Invalid creator address")
    }
    if (intentData.targetTokens.length !== intentData.destinationChainActions.length) {
      throw new Error("Invalid intentData: targetTokens and destinationChainActions must have the same length")
    }
    if (!quote && intentData.rewardTokens.length !== intentData.rewardTokenBalances.length) {
      throw new Error("Invalid intentData: rewardTokens and rewardTokenBalances must have the same length")
    }
    if (quote && quote.quoteData.rewardTokens.length !== quote.quoteData.rewardTokenAmounts.length) {
      throw new Error("Invalid quoteData: rewardTokens and rewardTokenAmounts must have the same length")
    }
    const calls = intentData.targetTokens.map((targetToken, index) => {
      return {
        target: targetToken,
        data: intentData.destinationChainActions[index]!,
        value: BigInt(0),
      }
    })
    const rewardTokens = (quote ? quote.quoteData.rewardTokens : intentData.rewardTokens).map((rewardToken, index) => {
      return {
        token: rewardToken,
        amount: BigInt((quote ? quote.quoteData.rewardTokenAmounts : intentData.rewardTokenBalances)[index]!),
      }
    })
    const salt = generateRandomHex()
    const route = {
      salt: salt,
      source: BigInt(intentData.originChainID),
      destination: BigInt(intentData.destinationChainID),
      inbox: EcoProtocolAddresses[this.getEcoChainId(intentData.destinationChainID)].Inbox,
      calls: calls,
    } as const;
    const reward = {
      creator,
      prover: intentData.proverContract,
      deadline: dateToTimestamp(getSecondsFromNow(90 * 60)), // 90 minutes from now
      nativeValue: BigInt(0),
      tokens: rewardTokens,
    } as const;
    const intent = {
      route: { ...route },
      reward: { ...reward },
    } as const;

    const { routeHash, rewardHash, intentHash } = hashIntent(intent)

    return {
      salt,
      routeHash,
      rewardHash,
      intentHash,
      intent
    }
  }

  /**
   * Returns the EcoChainId for a given chainId, appending "-pre" if the environment is pre-production.
   *
   * @param chainId - The chain ID to be converted to an EcoChainId.
   * @returns The EcoChainId, with "-pre" appended if the environment is pre-production.
   */
  getEcoChainId(chainId: RoutesSupportedChainId): EcoChainIds {
    return `${chainId}${this.isPreprod ? "-pre" : ""}`
  }

  private getProverContract(prover: "HyperProver" | "StorageProver" | Hex, chainID: RoutesSupportedChainId): Hex {
    let proverContract: Hex;
    const ecoChainID: EcoChainIds = this.getEcoChainId(chainID);
    switch (prover) {
      case "HyperProver": {
        proverContract = EcoProtocolAddresses[ecoChainID].HyperProver;
        break;
      }
      case "StorageProver": {
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

  static getTokenAddress(chainID: RoutesSupportedChainId, token: RoutesSupportedToken): Hex {
    const networkToken = NetworkTokens[chainID][token];
    if (!networkToken) {
      throw new Error(`Token ${token} not found on chain ${chainID}`);
    }
    return networkToken;
  }

  static validateNetworkTokenAddress(chainID: RoutesSupportedChainId, address: Hex) {
    const isValidToken = Object.values(NetworkTokens[chainID]).some((token) => token === address);
    if (!isValidToken) {
      throw new Error(`Invalid Token Address ${address} on chainId ${chainID}`);
    }
    return address;
  }
}
