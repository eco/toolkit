import { encodeFunctionData, erc20Abi, Hex, isAddress, isAddressEqual, zeroAddress } from "viem";
import { dateToTimestamp, generateRandomHex, getSecondsFromNow, isAmountInvalid } from "../utils";
import { CreateIntentParams, CreateSimpleIntentParams, ApplyQuoteToIntentParams } from "./types";

import { EcoChainIds, EcoChainIdsEnv, EcoProtocolAddresses, IntentType } from "@eco-foundation/routes-ts";
import { ECO_SDK_CONFIG } from "../config";

export class RoutesService {
  private isPreprod: boolean;

  constructor({ isPreprod }: { isPreprod?: boolean } = {}) {
    this.isPreprod = isPreprod || ECO_SDK_CONFIG.isPreprod || false;
  }

  /**
   * Creates a simple intent.
   *
   * @param {CreateSimpleIntentParams} params - The parameters for creating the simple intent.
   * 
   * @returns {IntentType} The created intent.
   * 
   * @throws {Error} If the creator address is invalid, the origin and destination chain are the same, the amount is invalid, or the expiry time is in the past. Or if there is no prover for the specified configuration.
   */
  createSimpleIntent({
    creator,
    originChainID,
    destinationChainID,
    receivingToken,
    spendingToken,
    spendingTokenLimit,
    amount,
    recipient = creator,
    prover = "HyperProver",
    expiryTime = getSecondsFromNow(90 * 60) // 90 minutes from now
  }: CreateSimpleIntentParams): IntentType {
    // validate
    if (!isAddress(creator, { strict: false })) {
      throw new Error("Invalid creator address");
    }
    if (!isAddress(recipient, { strict: false })) {
      throw new Error("Invalid recipient address");
    }
    if (originChainID === destinationChainID) {
      throw new Error("originChainID and destinationChainID cannot be the same");
    }
    if (isAmountInvalid(amount)) {
      throw new Error("Invalid amount");
    }
    if (spendingTokenLimit < BigInt(amount)) {
      throw new Error("Insufficient spendingTokenLimit");
    }
    if (expiryTime < getSecondsFromNow(60)) {
      throw new Error("Expiry time must be 60 seconds or more in the future");
    }

    // create calldata
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipient, amount]
    })

    return {
      route: {
        salt: generateRandomHex(),
        source: BigInt(originChainID),
        destination: BigInt(destinationChainID),
        inbox: EcoProtocolAddresses[this.getEcoChainId(destinationChainID)].Inbox,
        tokens: [
          {
            token: receivingToken,
            amount,
          }
        ],
        calls: [
          {
            target: receivingToken,
            data,
            value: BigInt(0),
          }
        ],
      },
      reward: {
        creator,
        prover: this.getProverContract(prover, originChainID),
        deadline: dateToTimestamp(expiryTime),
        nativeValue: BigInt(0),
        tokens: [
          {
            token: spendingToken,
            amount: spendingTokenLimit
          }
        ]
      }
    }
  }

  /**
   * Creates an intent.
   *
   * @param {CreateRouteParams} params - The parameters for creating the intent.
   * 
   * @returns {IntentType} The created intent.
   * 
   * @throws {Error} If the creator address is invalid, the origin and destination chain are the same, the calls or tokens are invalid, or the expiry time is in the past.
   */
  createIntent({
    creator,
    originChainID,
    destinationChainID,
    calls,
    callTokens,
    tokens,
    prover,
    expiryTime = getSecondsFromNow(90 * 60) // 90 minutes from now
  }: CreateIntentParams): IntentType {
    // validate
    if (!isAddress(creator, { strict: false })) {
      throw new Error("Invalid creator address");
    }
    if (originChainID === destinationChainID) {
      throw new Error("originChainID and destinationChainID cannot be the same");
    }
    if (!calls.length || calls.some(call => !isAddress(call.target, { strict: false }) || isAmountInvalid(call.value))) {
      throw new Error("Invalid calls");
    }
    if (!callTokens.length || callTokens.some(token => !isAddress(token.token, { strict: false }) || isAmountInvalid(token.amount))) {
      throw new Error("Invalid callTokens");
    }
    if (!tokens.length || tokens.some(token => !isAddress(token.token, { strict: false }) || isAmountInvalid(token.amount))) {
      throw new Error("Invalid tokens");
    }
    if (expiryTime < getSecondsFromNow(60)) {
      throw new Error("Expiry time must be 60 seconds or more in the future");
    }

    return {
      route: {
        salt: generateRandomHex(),
        source: BigInt(originChainID),
        destination: BigInt(destinationChainID),
        inbox: EcoProtocolAddresses[this.getEcoChainId(destinationChainID)].Inbox,
        tokens: callTokens,
        calls,
      },
      reward: {
        creator,
        prover: this.getProverContract(prover, originChainID),
        deadline: dateToTimestamp(expiryTime),
        nativeValue: BigInt(0),
        tokens
      }
    }
  }

  /**
   * Applies a quote to an intent, modifying the reward tokens.
   *
   * @param {ApplyQuoteToIntentParams} params - The parameters for applying the quote to the intent.
   *
   * @returns {IntentType} The intent with the quote applied.
   * 
   * @throws {Error} If the quote is invalid.
   */
  applyQuoteToIntent({ intent, quote }: ApplyQuoteToIntentParams): IntentType {
    if (!quote.quoteData.tokens.length) {
      throw new Error("Invalid quoteData: tokens array must have length greater than 0")
    }

    // only thing affected by the quote is the reward tokens
    intent.reward.tokens = quote.quoteData.tokens.map(({ token, amount }) => ({
      token: token,
      amount: BigInt(amount)
    }))

    return intent;
  }

  /**
   * Returns the EcoChainId for a given chainId, appending "-pre" if the environment is pre-production.
   *
   * @param chainId - The chain ID to be converted to an EcoChainId.
   * @returns The EcoChainId, with "-pre" appended if the environment is pre-production.
   */
  getEcoChainId(chainId: EcoChainIds): EcoChainIdsEnv {
    return `${chainId}${this.isPreprod ? "-pre" : ""}`
  }

  private getProverContract(prover: "HyperProver" | "MetaProver" | Hex | undefined, chainID: EcoChainIds): Hex {
    let proverContract: Hex;
    const ecoChainID: EcoChainIdsEnv = this.getEcoChainId(chainID);
    switch (prover) {
      case "HyperProver": {
        proverContract = EcoProtocolAddresses[ecoChainID].HyperProver;
        // if HyperProver is not found, throw
        if (isAddressEqual(proverContract, zeroAddress)) {
          throw new Error(`No HyperProver exists on '${chainID}'`);
        }
        break;
      }
      case "MetaProver": {
        // if MetaProver is not found, throw
        proverContract = EcoProtocolAddresses[ecoChainID].MetaProver;
        if (isAddressEqual(proverContract, zeroAddress)) {
          throw new Error(`No HyperProver exists on '${chainID}'`);
        }
        break;
      }
      case undefined: {
        // default to HyperProver, fall back to MetaProver, if not found throw
        proverContract = EcoProtocolAddresses[ecoChainID].HyperProver;
        if (isAddressEqual(proverContract, zeroAddress)) {
          proverContract = EcoProtocolAddresses[ecoChainID].MetaProver;
        }
        if (isAddressEqual(proverContract, zeroAddress)) {
          throw new Error(`No Prover found for '${chainID}'`);
        }
        break;
      }
      default: {
        proverContract = prover;
      }
    }
    return proverContract;
  }
}
