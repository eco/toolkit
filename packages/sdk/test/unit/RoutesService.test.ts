import { describe, test, expect, beforeAll } from "vitest";
import { RoutesService } from "../../src/routes";
import { encodeFunctionData, erc20Abi, Hex } from "viem";
import { getSecondsFromNow } from "../../src/utils";

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

  describe("createSimpleRoute", () => {
    test("valid", async () => {
      const validRoute = routesService.createSimpleRoute({
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: RoutesService.getTokenAddress(10, "USDC"),
        receivingToken: RoutesService.getTokenAddress(8453, "USDC"),
        amount: BigInt(1000000),
        prover: 'HyperProver',
        simpleRouteActionData: transferData
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
      const validRoute = routesService.createSimpleRoute({
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
        receivingToken: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
        amount: BigInt(1000000),
        prover: 'HyperProver',
        simpleRouteActionData: transferData
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
      expect(() => routesService.createSimpleRoute({
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: RoutesService.getTokenAddress(10, "USDC"),
        receivingToken: RoutesService.getTokenAddress(8453, "USDC"),
        amount: BigInt(1000000),
        prover: 'HyperProver',
        simpleRouteActionData: transferData,
        expiryTime: getSecondsFromNow(50),
      })).toThrow("Expiry time must be 60 seconds or more in the future");
    })

    test("invalidAmount", async () => {
      expect(() => routesService.createSimpleRoute({
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: RoutesService.getTokenAddress(10, "USDC"),
        receivingToken: RoutesService.getTokenAddress(8453, "USDC"),
        amount: BigInt(-1),
        prover: 'HyperProver',
        simpleRouteActionData: transferData
      })).toThrow("Invalid amount");
    })

    test("invalidProverForChain", async () => {
      expect(() => routesService.createSimpleRoute({
        originChainID: 42161,
        destinationChainID: 10,
        spendingToken: RoutesService.getTokenAddress(42161, "USDC"),
        receivingToken: RoutesService.getTokenAddress(10, "USDC"),
        amount: BigInt(1000000),
        prover: "StorageProver",
        simpleRouteActionData: transferData
      })).toThrow("No default prover found for this chain");
    })
  })

  describe("createRoute", () => {
    test("valid", async () => {
      const validRoute = routesService.createRoute({
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
      const validRoute = routesService.createRoute({
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
      expect(() => routesService.createRoute({
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
      expect(() => routesService.createRoute({
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
      expect(() => routesService.createRoute({
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
      expect(() => routesService.createRoute({
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
})
