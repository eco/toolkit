import { describe, test, expect, beforeAll, beforeEach } from "vitest";
import { QuotesService } from "../../src/quotes";
import { RoutesService } from "../../src/routes";
import { encodeFunctionData, erc20Abi, Hex } from "viem";
import { Route } from "../../src/routes/types";
import { getSecondsFromNow } from "../../src/utils";

describe("QuotesService", () => {
  let routesService: RoutesService;
  let quotesService: QuotesService;
  let transferData: Hex;
  let validRoute: Route;

  beforeAll(() => {
    routesService = new RoutesService();
    quotesService = new QuotesService({ dAppID: "test" });
    transferData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: ['0xe494e1285d741F90b4BA51482fa7c1031B2DD294', BigInt(1000000)]
    })
  });

  beforeEach(() => {
    validRoute = routesService.createSimpleRoute({
      originChainID: 10,
      destinationChainID: 8453,
      spendingToken: "USDC",
      acquiringToken: "USDC",
      amount: BigInt(1000000),
      prover: 'HyperProver',
      simpleRouteActionData: transferData
    });
  })

  describe("requestQuotesForRoute", () => {
    test("valid", async () => {
      const response = await quotesService.requestQuotesForRoute(validRoute);

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.length).toBeGreaterThan(0);

      for (const quote of response.data) {
        expect(quote.receiveSignedIntentUrl).toBeDefined();
        expect(quote.intentSourceContract).toBeDefined();
        expect(quote.quoteData).toBeDefined();
        expect(quote.quoteData.expiryTime).toBeDefined();
        expect(quote.quoteData.rewardTokens).toBeDefined();
        expect(quote.quoteData.rewardTokens.length).toBeGreaterThan(0);
        expect(quote.quoteData.rewardTokenAmounts).toBeDefined();
        expect(quote.quoteData.rewardTokenAmounts.length).toBeGreaterThan(0);
      }
    });

    test("empty", async () => {
      const emptyRoute: Route = {
        originChainID: 10,
        destinationChainID: 8453,
        targetTokens: [],
        rewardTokens: [],
        rewardTokenBalances: [],
        destinationChainActions: [],
        proverContract: "0x0",
        expiryTime: new Date()
      }

      await expect(quotesService.requestQuotesForRoute(emptyRoute)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalidRewardToken", async () => {
      const invalidRoute = validRoute;
      invalidRoute.rewardTokens = ["0x0"];

      await expect(quotesService.requestQuotesForRoute(invalidRoute)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalidTargetToken", async () => {
      const invalidRoute = validRoute;
      invalidRoute.targetTokens = ["0x0"];

      await expect(quotesService.requestQuotesForRoute(invalidRoute)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalidExpiryTime", async () => {
      const invalidRoute = validRoute;
      invalidRoute.expiryTime = getSecondsFromNow(50); // must be 60 seconds in the future or more

      await expect(quotesService.requestQuotesForRoute(invalidRoute)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalidRewardTokenBalance", async () => {
      const invalidRoute = validRoute;
      invalidRoute.rewardTokenBalances = [BigInt(-1)];

      await expect(quotesService.requestQuotesForRoute(invalidRoute)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalidProver", async () => {
      const invalidRoute = validRoute;
      invalidRoute.proverContract = "0x0";

      await expect(quotesService.requestQuotesForRoute(invalidRoute)).rejects.toThrow("Request failed with status code 400");
    })
  });
});
