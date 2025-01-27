import { describe, test, expect, beforeAll, beforeEach } from "vitest";
import { encodeFunctionData, erc20Abi, Hex } from "viem";
import { EcoProtocolAddresses, hashIntent, hashReward, hashRoute } from "@eco-foundation/routes-ts";

import { RoutesService, IntentData, SolverQuote } from "../../src";
import { dateToTimestamp, getSecondsFromNow } from "../../src/utils";

describe("RoutesService", () => {
  let routesService: RoutesService;
  let transferData: Hex;

  beforeAll(() => {
    routesService = new RoutesService();
    transferData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: ['0xe494e1285d741F90b4BA51482fa7c1031B2DD294', BigInt(1000000)]
    })
  })

  describe("createSimpleIntent", () => {
    test("valid", async () => {
      const validRoute = routesService.createSimpleIntent({
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: RoutesService.getTokenAddress(10, "USDC"),
        receivingToken: RoutesService.getTokenAddress(8453, "USDC"),
        amount: BigInt(1000000),
        prover: 'HyperProver',
        simpleIntentActionData: transferData
      });

      expect(validRoute).toBeDefined();
      expect(validRoute.originChainID).toBe(10);
      expect(validRoute.destinationChainID).toBe(8453);
      expect(validRoute.targetTokens).toBeDefined();
      expect(validRoute.rewardTokens).toBeDefined();
      expect(validRoute.rewardTokenBalances).toBeDefined();
      expect(validRoute.proverContract).toBeDefined();
      expect(validRoute.destinationChainActions).toBeDefined();
      expect(validRoute.expiryTime).toBeDefined();
    })

    test("validCustomTokens", async () => {
      const validRoute = routesService.createSimpleIntent({
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
        receivingToken: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
        amount: BigInt(1000000),
        prover: 'HyperProver',
        simpleIntentActionData: transferData
      });

      expect(validRoute).toBeDefined();
      expect(validRoute.originChainID).toBe(10);
      expect(validRoute.destinationChainID).toBe(8453);
      expect(validRoute.targetTokens).toBeDefined();
      expect(validRoute.rewardTokens).toBeDefined();
      expect(validRoute.rewardTokenBalances).toBeDefined();
      expect(validRoute.proverContract).toBeDefined();
      expect(validRoute.destinationChainActions).toBeDefined();
      expect(validRoute.expiryTime).toBeDefined();
    })



    test("invalidExpiryTime", async () => {
      expect(() => routesService.createSimpleIntent({
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: RoutesService.getTokenAddress(10, "USDC"),
        receivingToken: RoutesService.getTokenAddress(8453, "USDC"),
        amount: BigInt(1000000),
        prover: 'HyperProver',
        simpleIntentActionData: transferData,
        expiryTime: getSecondsFromNow(50),
      })).toThrow("Expiry time must be 60 seconds or more in the future");
    })

    test("invalidAmount", async () => {
      expect(() => routesService.createSimpleIntent({
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: RoutesService.getTokenAddress(10, "USDC"),
        receivingToken: RoutesService.getTokenAddress(8453, "USDC"),
        amount: BigInt(-1),
        prover: 'HyperProver',
        simpleIntentActionData: transferData
      })).toThrow("Invalid amount");
    })

    test("invalidProverForChain", async () => {
      expect(() => routesService.createSimpleIntent({
        originChainID: 42161,
        destinationChainID: 10,
        spendingToken: RoutesService.getTokenAddress(42161, "USDC"),
        receivingToken: RoutesService.getTokenAddress(10, "USDC"),
        amount: BigInt(1000000),
        prover: "StorageProver",
        simpleIntentActionData: transferData
      })).toThrow("No default prover found for this chain");
    })
  })

  describe("createIntent", () => {
    test("valid", async () => {
      const validRoute = routesService.createIntent({
        originChainID: 10,
        destinationChainID: 8453,
        targetTokens: [RoutesService.getTokenAddress(8453, "USDC")],
        rewardTokens: [RoutesService.getTokenAddress(10, "USDC")],
        rewardTokenBalances: [BigInt(1000000)],
        prover: "HyperProver",
        destinationChainActions: [transferData],
      })

      expect(validRoute).toBeDefined();
      expect(validRoute.originChainID).toBe(10);
      expect(validRoute.destinationChainID).toBe(8453);
      expect(validRoute.targetTokens).toBeDefined();
      expect(validRoute.rewardTokens).toBeDefined();
      expect(validRoute.rewardTokenBalances).toBeDefined();
      expect(validRoute.proverContract).toBeDefined();
      expect(validRoute.destinationChainActions).toBeDefined();
      expect(validRoute.expiryTime).toBeDefined();
    })

    test("validCustomTokens", async () => {
      const validRoute = routesService.createIntent({
        originChainID: 10,
        destinationChainID: 8453,
        targetTokens: ["0x0555E30da8f98308EdB960aa94C0Db47230d2B9c"],
        rewardTokens: ["0x68f180fcCe6836688e9084f035309E29Bf0A2095"],
        rewardTokenBalances: [BigInt(1000000)],
        prover: "HyperProver",
        destinationChainActions: [transferData],
      })

      expect(validRoute).toBeDefined();
      expect(validRoute.originChainID).toBe(10);
      expect(validRoute.destinationChainID).toBe(8453);
      expect(validRoute.targetTokens).toBeDefined();
      expect(validRoute.rewardTokens).toBeDefined();
      expect(validRoute.rewardTokenBalances).toBeDefined();
      expect(validRoute.proverContract).toBeDefined();
      expect(validRoute.destinationChainActions).toBeDefined();
      expect(validRoute.expiryTime).toBeDefined();
    })

    test("empty", async () => {
      expect(() => routesService.createIntent({
        originChainID: 10,
        destinationChainID: 8453,
        targetTokens: [],
        rewardTokens: [],
        rewardTokenBalances: [],
        prover: "HyperProver",
        destinationChainActions: [],
      })).toThrow("Invalid route parameters");
    })

    test("invalidExpiryTime", async () => {
      expect(() => routesService.createIntent({
        originChainID: 10,
        destinationChainID: 8453,
        targetTokens: [RoutesService.getTokenAddress(8453, "USDC")],
        rewardTokens: [RoutesService.getTokenAddress(10, "USDC")],
        rewardTokenBalances: [BigInt(1000000)],
        prover: "HyperProver",
        destinationChainActions: [transferData],
        expiryTime: getSecondsFromNow(50),
      })).toThrow("Expiry time must be 60 seconds or more in the future");
    })

    test("invalidRewardTokenBalance", async () => {
      expect(() => routesService.createIntent({
        originChainID: 10,
        destinationChainID: 8453,
        targetTokens: [RoutesService.getTokenAddress(8453, "USDC")],
        rewardTokens: [RoutesService.getTokenAddress(10, "USDC")],
        rewardTokenBalances: [BigInt(-1)],
        prover: "HyperProver",
        destinationChainActions: [transferData],
      })).toThrow("Invalid reward token balance");
    })

    test("invalidProverForChain", async () => {
      expect(() => routesService.createIntent({
        originChainID: 42161,
        destinationChainID: 10,
        targetTokens: [RoutesService.getTokenAddress(10, "USDC")],
        rewardTokens: [RoutesService.getTokenAddress(42161, "USDC")],
        rewardTokenBalances: [BigInt(1000000)],
        prover: "StorageProver",
        destinationChainActions: [transferData],
      })).toThrow("No default prover found for this chain");
    })
  })

  describe("setupIntentForPublishing", () => {
    let validIntentData: IntentData;
    let validQuote: SolverQuote;
    let validCreator: Hex;

    beforeAll(() => {
      validIntentData = routesService.createSimpleIntent({
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: RoutesService.getTokenAddress(10, "USDC"),
        receivingToken: RoutesService.getTokenAddress(8453, "USDC"),
        amount: BigInt(1000000),
        prover: 'HyperProver',
        simpleIntentActionData: transferData
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

    test("validWithQuote", () => {
      const creator = validCreator;
      const intentData = validIntentData;
      const quote = validQuote;

      const { intent, intentHash, routeHash, rewardHash } = routesService.setupIntentForPublishing({ creator, intentData, quote });

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

    test("validWithoutQuote", () => {
      const creator = validCreator;
      const intentData = validIntentData;

      const { intent, intentHash, routeHash, rewardHash } = routesService.setupIntentForPublishing({ creator, intentData });

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

      expect(() => routesService.setupIntentForPublishing({ creator, intentData, quote })).toThrow(`Invalid creator address`);
    });

    test("invalid intent data actions", () => {
      const creator = validCreator;
      const intentData: IntentData = {
        ...validIntentData,
        destinationChainActions: []
      };
      const quote = validQuote;

      expect(() => routesService.setupIntentForPublishing({ creator, intentData, quote })).toThrow(`Invalid intentData: targetTokens and destinationChainActions must have the same length`);
    });

    test("invalid intent data reward", () => {
      const creator = validCreator;
      const intentData: IntentData = {
        ...validIntentData,
        rewardTokenBalances: [],
      };

      expect(() => routesService.setupIntentForPublishing({ creator, intentData })).toThrow(`Invalid intentData: rewardTokens and rewardTokenBalances must have the same length`);
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

      expect(() => routesService.setupIntentForPublishing({ creator, intentData, quote })).toThrow("Invalid quoteData: rewardTokens and rewardTokenAmounts must have the same length");
    });
  });
})
