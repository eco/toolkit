import { describe, test, expect, beforeAll, beforeEach } from "vitest";
import { encodeFunctionData, erc20Abi, Hex } from "viem";

import { EcoProtocolAddresses, hashRoute, hashReward, hashIntent } from "@eco-foundation/routes-ts";

import { RoutesService, IntentsService, SolverQuote, IntentData } from "../../src";
import { dateToTimestamp, getSecondsFromNow } from "../../src/utils";

describe("IntentsService", () => {
  let routesService: RoutesService;
  let intentsService: IntentsService;

  let validIntentData: IntentData;
  let validQuote: SolverQuote;
  let validCreator: Hex;

  beforeAll(() => {
    routesService = new RoutesService();
    intentsService = new IntentsService();
    validIntentData = routesService.createSimpleRoute({
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
    validCreator = "0xe494e1285d741F90b4BA51482fa7c1031B2DD294"
  })

  beforeEach(() => {
    validQuote = {
      receiveSignedIntentUrl: "https://example.com/endpoint",
      intentSourceContract: EcoProtocolAddresses[10].IntentSource,
      quoteData: {
        rewardTokens: [RoutesService.getTokenAddress(10, "USDC")],
        rewardTokenAmounts: ["1000000"],
        expiryTime: dateToTimestamp(getSecondsFromNow(60)).toString()
      }
    };
  });

  describe("setupIntentForPublishing", () => {
    test("valid", () => {
      const creator = validCreator;
      const intentData = validIntentData;
      const quote = validQuote;

      const { intent, intentHash, routeHash, rewardHash } = intentsService.setupIntentForPublishing({ creator, intentData, quote });

      expect(intent).toBeDefined();
      expect(intent.route).toBeDefined();
      expect(intent.reward).toBeDefined();
      expect(routeHash).toBeDefined();
      expect(rewardHash).toBeDefined();
      expect(intentHash).toBeDefined();
      expect(hashRoute(intent.route)).toBe(routeHash);
      expect(hashReward(intent.reward)).toBe(rewardHash);
      expect(hashIntent(intent)).toEqual({ intentHash, routeHash, rewardHash });
    });

    test("invalid creator address", () => {
      const creator = "0x";
      const intentData = validIntentData;
      const quote = validQuote;

      expect(() => intentsService.setupIntentForPublishing({ creator, intentData, quote })).toThrow(`Invalid creator address`);
    });

    test("invalid intent data", () => {
      const creator = validCreator;
      const intentData: IntentData = {
        ...validIntentData,
        destinationChainActions: []
      };
      const quote = validQuote;

      expect(() => intentsService.setupIntentForPublishing({ creator, intentData, quote })).toThrow(`Invalid intentData: targetTokens and destinationChainActions must have the same length`);
    });

    test("invalid quote data", () => {
      const creator = validCreator;
      const intentData = validIntentData;
      const quote: SolverQuote = {
        ...validQuote,
        quoteData: {
          ...validQuote.quoteData,
          rewardTokenAmounts: [],
        }
      };

      expect(() => intentsService.setupIntentForPublishing({ creator, intentData, quote })).toThrow("Invalid quoteData: rewardTokens and rewardTokenAmounts must have the same length");
    });
  });
});