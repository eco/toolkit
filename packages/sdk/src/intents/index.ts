import { encodePacked, keccak256 } from "viem";
import { generateRandomHex } from "../utils";
import { SetupIntentForPublishingParams } from "./types";

import { EcoProtocolAddresses, encodeRoute, encodeReward, EcoChainIds } from "@eco-foundation/routes";
import { ChainId } from "../constants/types";

export class IntentsService {
  private isPreprod: boolean

  constructor({ isPreprod }: { isPreprod: boolean } = { isPreprod: false }) {
    this.isPreprod = isPreprod
  }

  setupIntentForPublishing({ creator, intentData, quote }: SetupIntentForPublishingParams) {
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
    }
    const reward = {
      creator,
      prover: intentData.proverContract,
      deadline: BigInt(quote.quoteData.expiryTime),
      nativeValue: 0n,
      tokens: rewardTokens,
    }
    const routeHash = keccak256(encodeRoute(route))
    const rewardHash = keccak256(encodeReward(reward))
    const intentHash = keccak256(
      encodePacked(['bytes32', 'bytes32'], [routeHash, rewardHash]),
    )

    const intent = {
      route,
      reward,
    } as const;

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
