import { generateRandomHex } from "../utils";
import { SetupIntentForPublishingParams } from "./types";
import { EcoProtocolAddresses, EcoChainIds, hashIntent } from "@eco-foundation/routes-ts";
import { ChainId } from "../constants/types";
import { isAddress } from "viem";

export class IntentsService {
  private isPreprod: boolean

  constructor({ isPreprod }: { isPreprod: boolean } = { isPreprod: false }) {
    this.isPreprod = isPreprod
  }

  setupIntentForPublishing({ creator, intentData, quote }: SetupIntentForPublishingParams) {
    // validate
    if (!isAddress(creator, { strict: false })) {
      throw new Error("Invalid creator address")
    }
    if (intentData.targetTokens.length !== intentData.destinationChainActions.length) {
      throw new Error("Invalid intentData: targetTokens and destinationChainActions must have the same length")
    }
    if (quote.quoteData.rewardTokens.length !== quote.quoteData.rewardTokenAmounts.length) {
      throw new Error("Invalid quoteData: rewardTokens and rewardTokenAmounts must have the same length")
    }
    const calls = intentData.targetTokens.map((targetToken, index) => {
      return {
        target: targetToken,
        data: intentData.destinationChainActions[index]!,
        value: 0n,
      }
    })
    const rewardTokens = quote.quoteData.rewardTokens.map((rewardToken, index) => {
      return {
        token: rewardToken,
        amount: BigInt(quote.quoteData.rewardTokenAmounts[index]!),
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
      deadline: BigInt(quote.quoteData.expiryTime),
      nativeValue: 0n,
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

  private getEcoChainId(chainId: ChainId): EcoChainIds {
    return `${chainId}${this.isPreprod ? "-pre" : ""}`
  }
}
