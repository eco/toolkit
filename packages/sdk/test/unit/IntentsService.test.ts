import { describe, test, expect, beforeAll, beforeEach } from "vitest";
import { encodeFunctionData, erc20Abi, Hex, keccak256 } from "viem";

import { EcoProtocolAddresses } from "@eco-foundation/routes";

import { RoutesService, IntentsService, SolverQuote, IntentData } from "../../src";
import { dateToTimestamp, getSecondsFromNow } from "../../src/utils";
import { encodeRoute, encodeReward, encodeIntent } from "../../src/intents/utils";

describe("IntentsService", () => {
  let routesService: RoutesService;
  let intentsService: IntentsService;

  let validIntentData: IntentData;
  let validQuote: SolverQuote;
  let creator: Hex;

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
    creator = "0xe494e1285d741F90b4BA51482fa7c1031B2DD294"
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
    test("valid", async () => {
      const intentData = validIntentData;
      const quote = validQuote;

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

    test("invalid creator address", () => {
      creator = "0x";
      const intentData = validIntentData;
      const quote = validQuote;

      expect(() => intentsService.setupIntentForPublishing({ creator, intentData, quote })).toThrow(`Address "0x" is invalid.`);
    });

    test("invalid intent data", async () => {
      const creator = "0xe494e1285d741F90b4BA51482fa7c1031B2DD294";
      const intentData: IntentData = {
        ...validIntentData,
        destinationChainActions: []
      };
      const quote = validQuote;

      expect(() => intentsService.setupIntentForPublishing({ creator, intentData, quote })).toThrow(`Cannot read properties of undefined (reading 'length')`);
    });

    test("invalid quote data", async () => {
      const creator = "0xe494e1285d741F90b4BA51482fa7c1031B2DD294";
      const intentData = validIntentData;
      const quote: SolverQuote = {
        ...validQuote,
        quoteData: {
          ...validQuote.quoteData,
          rewardTokenAmounts: [],
        }
      };

      expect(() => intentsService.setupIntentForPublishing({ creator, intentData, quote })).toThrow("Cannot convert undefined to a BigInt");
    });

  });
});