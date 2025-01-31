import { describe, test, expect, beforeAll, beforeEach } from "vitest";

import { RoutesService, OpenQuotingClient, SimpleIntentActionData, RoutesSupportedToken } from "../../src";
import { dateToTimestamp, getSecondsFromNow } from "../../src/utils";
import { zeroHash } from "viem";
import { IntentType } from "@eco-foundation/routes-ts";

describe("OpenQuotingClient", () => {
  let routesService: RoutesService;
  let openQuotingClient: OpenQuotingClient;
  let action: SimpleIntentActionData;
  let validIntent: IntentType;

  const creator = '0xe494e1285d741F90b4BA51482fa7c1031B2DD294'

  beforeAll(() => {
    routesService = new RoutesService();
    openQuotingClient = new OpenQuotingClient({ dAppID: "test" });
    action = {
      functionName: 'transfer',
      recipient: creator
    }
  });

  beforeEach(() => {
    validIntent = routesService.createSimpleIntent({
      creator,
      originChainID: 10,
      destinationChainID: 8453,
      spendingToken: RoutesService.getTokenAddress(10, RoutesSupportedToken.USDC),
      receivingToken: RoutesService.getTokenAddress(8453, RoutesSupportedToken.USDC),
      amount: BigInt(1000000),
      prover: 'HyperProver',
      simpleIntentActionData: action
    });
  })

  describe("requestQuotesForIntent", () => {
    test("valid", async () => {
      const quotes = await openQuotingClient.requestQuotesForIntent(validIntent);

      expect(quotes).toBeDefined();
      expect(quotes.length).toBeGreaterThan(0);

      for (const quote of quotes) {
        expect(quote.receiveSignedIntentUrl).toBeDefined();
        expect(quote.intentSourceContract).toBeDefined();
        expect(quote.quoteData).toBeDefined();
        expect(quote.quoteData.expiryTime).toBeDefined();
        expect(quote.quoteData.tokens).toBeDefined();
        expect(quote.quoteData.tokens.length).toBeGreaterThan(0);
        for (const token of quote.quoteData.tokens) {
          expect(token).toBeDefined();
          expect(token.balance).toBeDefined();
          expect(token.balance).toBeGreaterThan(0);
          expect(token.token).toBeDefined();
        }
      }
    });

    test("empty", async () => {
      const emptyIntent: IntentType = {
        route: {
          salt: "0x",
          source: BigInt(10),
          destination: BigInt(8453),
          inbox: "0x",
          calls: []
        },
        reward: {
          creator: "0x0",
          prover: "0x0",
          deadline: BigInt(0),
          nativeValue: BigInt(0),
          tokens: []
        }
      }

      await expect(openQuotingClient.requestQuotesForIntent(emptyIntent)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalid:route.source", async () => {
      const invalidIntent = validIntent;
      invalidIntent.route.source = BigInt(0);

      await expect(openQuotingClient.requestQuotesForIntent(invalidIntent)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalid:route.destination", async () => {
      const invalidIntent = validIntent;
      invalidIntent.route.destination = BigInt(0);

      await expect(openQuotingClient.requestQuotesForIntent(invalidIntent)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalid:route.salt", async () => {
      const invalidIntent = validIntent;
      invalidIntent.route.salt = "0x0";

      await expect(openQuotingClient.requestQuotesForIntent(invalidIntent)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalid:route.inbox", async () => {
      const invalidIntent = validIntent;
      invalidIntent.route.inbox = "0x0";

      await expect(openQuotingClient.requestQuotesForIntent(invalidIntent)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalid:route.calls", async () => {
      const invalidIntent = validIntent;
      invalidIntent.route.calls = [{ target: "0x0", data: zeroHash, value: BigInt(0) }];

      await expect(openQuotingClient.requestQuotesForIntent(invalidIntent)).rejects.toThrow("Request failed with status code 400");

      invalidIntent.route.calls = [{ target: RoutesService.getTokenAddress(10, RoutesSupportedToken.USDC), data: zeroHash, value: BigInt(-1) }];

      await expect(openQuotingClient.requestQuotesForIntent(invalidIntent)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalid:reward.creator", async () => {
      const invalidIntent = validIntent;
      invalidIntent.reward.creator = "0x0";

      await expect(openQuotingClient.requestQuotesForIntent(invalidIntent)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalid:reward.prover", async () => {
      const invalidIntent = validIntent;
      invalidIntent.reward.prover = "0x0";

      await expect(openQuotingClient.requestQuotesForIntent(invalidIntent)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalid:reward.deadline", async () => {
      const invalidIntent = validIntent;
      invalidIntent.reward.deadline = dateToTimestamp(getSecondsFromNow(50)); // must be 60 seconds in the future or more

      await expect(openQuotingClient.requestQuotesForIntent(invalidIntent)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalid:reward.nativeValue", async () => {
      const invalidIntent = validIntent;
      invalidIntent.reward.nativeValue = BigInt(-1);

      await expect(openQuotingClient.requestQuotesForIntent(invalidIntent)).rejects.toThrow("Request failed with status code 400");
    })

    test("invalid:reward.tokens", async () => {
      const invalidIntent = validIntent;
      invalidIntent.reward.tokens = [{ token: "0x0", amount: BigInt(1000000) }];

      await expect(openQuotingClient.requestQuotesForIntent(invalidIntent)).rejects.toThrow("Request failed with status code 400");

      invalidIntent.reward.tokens = [{ token: RoutesService.getTokenAddress(10, RoutesSupportedToken.USDC), amount: BigInt(-1) }];
      await expect(openQuotingClient.requestQuotesForIntent(invalidIntent)).rejects.toThrow("Request failed with status code 400");
    })
  });
});
