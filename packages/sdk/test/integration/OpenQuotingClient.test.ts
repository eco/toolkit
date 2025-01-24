import { describe, test, expect, beforeAll, beforeEach } from "vitest";
import { OpenQuotingClient } from "../../src/quotes";
import { RoutesService } from "../../src/routes";
import { encodeFunctionData, erc20Abi, Hex } from "viem";
import { IntentData } from "../../src/intents/types";
import { getSecondsFromNow } from "../../src/utils";

describe("OpenQuotingClient", () => {
  let routesService: RoutesService;
  let openQuotingClient: OpenQuotingClient;
  let transferData: Hex;
  let validIntentData: IntentData;

  beforeAll(() => {
    routesService = new RoutesService();
    openQuotingClient = new OpenQuotingClient({ dAppID: "test" });
    transferData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: ['0xe494e1285d741F90b4BA51482fa7c1031B2DD294', BigInt(1000000)]
    })
  });

  beforeEach(() => {
    validIntentData = routesService.createSimpleRoute({
      originChainID: 10,
      destinationChainID: 8453,
      spendingToken: RoutesService.getTokenAddress(10, "USDC"),
      receivingToken: RoutesService.getTokenAddress(8453, "USDC"),
      amount: BigInt(1000000),
      prover: 'HyperProver',
      simpleRouteActionData: transferData
    });
  })

  describe("requestQuotesForIntent", () => {
    test("valid", async () => {
      const quotes = await openQuotingClient.requestQuotesForIntent(validIntentData);

      expect(quotes).toBeDefined();
      expect(quotes.length).toBeGreaterThan(0);

      for (const quote of quotes) {
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
      const emptyRoute: IntentData = {
        originChainID: 10,
        destinationChainID: 8453,
        targetTokens: [],
        rewardTokens: [],
        rewardTokenBalances: [],
        destinationChainActions: [],
        proverContract: "0x0",
        expiryTime: new Date()
      }

      await expect(openQuotingClient.requestQuotesForIntent(emptyRoute)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalidRewardToken", async () => {
      const invalidRoute = validIntentData;
      invalidRoute.rewardTokens = ["0x0"];

      await expect(openQuotingClient.requestQuotesForIntent(invalidRoute)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalidTargetToken", async () => {
      const invalidRoute = validIntentData;
      invalidRoute.targetTokens = ["0x0"];

      await expect(openQuotingClient.requestQuotesForIntent(invalidRoute)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalidExpiryTime", async () => {
      const invalidRoute = validIntentData;
      invalidRoute.expiryTime = getSecondsFromNow(50); // must be 60 seconds in the future or more

      await expect(openQuotingClient.requestQuotesForIntent(invalidRoute)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalidRewardTokenBalance", async () => {
      const invalidRoute = validIntentData;
      invalidRoute.rewardTokenBalances = [BigInt(-1)];

      await expect(openQuotingClient.requestQuotesForIntent(invalidRoute)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalidProver", async () => {
      const invalidRoute = validIntentData;
      invalidRoute.proverContract = "0x0";

      await expect(openQuotingClient.requestQuotesForIntent(invalidRoute)).rejects.toThrow("Request failed with status code 400");
    })
  });
});
