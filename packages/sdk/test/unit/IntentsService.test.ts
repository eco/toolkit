import { describe, test, expect, beforeAll } from "vitest";
import { encodeFunctionData, erc20Abi, keccak256 } from "viem";

import { EcoProtocolAddresses } from "@eco-foundation/routes";

import { RoutesService, IntentsService, SolverQuote } from "../../src";
import { dateToTimestamp, getSecondsFromNow } from "../../src/utils";
import { encodeRoute, encodeReward, encodeIntent } from "../../src/intents/utils";

describe("IntentsService", () => {
  let routesService: RoutesService;
  let intentsService: IntentsService;

  beforeAll(async () => {
    routesService = new RoutesService();
    intentsService = new IntentsService();
  });

  describe("setupIntentForPublishing", () => {
    test("valid", async () => {
      const creator = "0xe494e1285d741F90b4BA51482fa7c1031B2DD294";
      const intentData = routesService.createSimpleRoute({
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: RoutesService.getTokenAddress(10, "USDC"),
        receivingToken: RoutesService.getTokenAddress(8453, "USDC"),
        amount: BigInt(1000000),
        prover: 'HyperProver',
        simpleRouteActionData: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: ['0xe494e1285d741F90b4BA51482fa7c1031B2DD294', BigInt(1000000)]
        })
      });

      const quote: SolverQuote = {
        receiveSignedIntentUrl: "https://example.com",
        intentSourceContract: EcoProtocolAddresses[10].IntentSource,
        quoteData: {
          rewardTokens: [RoutesService.getTokenAddress(10, "USDC")],
          rewardTokenAmounts: ["1000000"],
          expiryTime: dateToTimestamp(getSecondsFromNow(60)).toString()
        }
      };

      const { intent, intentHash, routeHash, rewardHash } = intentsService.setupIntentForPublishing({ creator, intentData, quote });

      expect(intent).toBeDefined();
      expect(intent.route).toBeDefined();
      expect(intent.reward).toBeDefined();
      expect(routeHash).toBeDefined();
      expect(rewardHash).toBeDefined();
      expect(intentHash).toBeDefined();
      expect(keccak256(encodeRoute(intent.route))).toBe(routeHash);
      expect(keccak256(encodeReward(intent.reward))).toBe(rewardHash);
      expect(keccak256(encodeIntent(intent))).toBe(intentHash);
    });
  });
});