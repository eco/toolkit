import { describe, test, expect, beforeAll } from "vitest";
import { RoutesService } from "../../src/routes";
import { encodeFunctionData, erc20Abi } from "viem";

describe("RoutesService", () => {
  let routesService: RoutesService;

  beforeAll(() => {
    routesService = new RoutesService();
  })

  test("createSimpleRoute:valid", async () => {
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: ['0xe494e1285d741F90b4BA51482fa7c1031B2DD294', BigInt(1000000)]
    })

    const validRoute = routesService.createSimpleRoute({
      originChainID: 10,
      destinationChainID: 8453,
      targetTokens: ["USDC"],
      rewardTokens: ["USDC"],
      rewardTokenBalances: [BigInt(1000000)],
      prover: "HYPERPROVER",
      destinationChainActions: [data],
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
  });

  test("createSimpleRoute:empty", async () => {
    expect(() => routesService.createSimpleRoute({
      originChainID: 10,
      destinationChainID: 8453,
      targetTokens: [],
      rewardTokens: [],
      rewardTokenBalances: [],
      prover: "HyperProver",
      destinationChainActions: [],
    })).toThrow("Invalid route parameters");
  })

  test("createSimpleRoute:invalidToken", async () => {
    expect(() => routesService.createSimpleRoute({
      originChainID: 8453,
      destinationChainID: 10,
      targetTokens: ["USDbC"],
      rewardTokens: ["USDT"],
      rewardTokenBalances: [BigInt(1000000)],
      prover: "HyperProver",
      destinationChainActions: ["0x0"],
    })).toThrow("Token USDbC not found on chain 10");
  })

  test("createSimpleRoute:invalidExpiryTime", async () => {
    expect(() => routesService.createSimpleRoute({
      originChainID: 10,
      destinationChainID: 8453,
      targetTokens: ["USDC"],
      rewardTokens: ["USDC"],
      rewardTokenBalances: [BigInt(1000000)],
      prover: "HyperProver",
      destinationChainActions: ["0x0"],
      expiryTime: new Date(Date.now() - 1000),
    })).toThrow("Expiry time must be in the future");
  })

  test("createSimpleRoute:invalidProverForChain", async () => {
    expect(() => routesService.createSimpleRoute({
      originChainID: 42161,
      destinationChainID: 10,
      targetTokens: ["USDC"],
      rewardTokens: ["USDC"],
      rewardTokenBalances: [BigInt(1000000)],
      prover: "Prover",
      destinationChainActions: ["0x0"],
    })).toThrow("No default prover found for this chain");
  });
});
