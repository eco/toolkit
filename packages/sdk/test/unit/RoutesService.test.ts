import { describe, test, expect, beforeAll, beforeEach } from "vitest";
import { encodeFunctionData, erc20Abi, Hex, isAddress, zeroAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { EcoProtocolAddresses, IntentType } from "@eco-foundation/routes-ts";

import { RoutesService, SolverQuote } from "../../src";
import { dateToTimestamp, getSecondsFromNow } from "../../src/utils";

const account = privateKeyToAccount(process.env.VITE_TESTING_PK as Hex)

describe("RoutesService", () => {
  let routesService: RoutesService;

  const creator = account.address

  beforeAll(() => {
    routesService = new RoutesService();
  })

  describe("createSimpleIntent", () => {
    test("valid", async () => {
      const validIntent = routesService.createSimpleIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: RoutesService.getStableAddress(10, "USDC"),
        spendingTokenLimit: BigInt(10000000),
        receivingToken: RoutesService.getStableAddress(8453, "USDC"),
        amount: BigInt(1000000),
        prover: 'HyperProver',
      });

      expect(validIntent).toBeDefined();
      expect(validIntent).toBeDefined();
      expect(validIntent.route).toBeDefined();
      expect(validIntent.route.salt).toBeDefined();
      expect(validIntent.route.source).toBeDefined();
      expect(validIntent.route.destination).toBeDefined();
      expect(validIntent.route.inbox).toBeDefined();
      expect(isAddress(validIntent.route.inbox, { strict: false })).toBe(true);
      expect(validIntent.route.calls).toBeDefined();
      expect(validIntent.route.calls.length).toBeGreaterThan(0);
      for (const call of validIntent.route.calls) {
        expect(call.target).toBeDefined();
        expect(isAddress(call.target, { strict: false })).toBe(true);
        expect(call.data).toBeDefined();
        expect(call.value).toBeDefined();
      }
      expect(validIntent.reward).toBeDefined();
      expect(validIntent.reward.creator).toBeDefined();
      expect(isAddress(validIntent.reward.creator, { strict: false })).toBe(true);
      expect(validIntent.reward.prover).toBeDefined();
      expect(isAddress(validIntent.reward.prover, { strict: false })).toBe(true);
      expect(validIntent.reward.deadline).toBeDefined();
      expect(validIntent.reward.nativeValue).toBeDefined();
      expect(validIntent.reward.tokens).toBeDefined();
      expect(validIntent.reward.tokens.length).toBeGreaterThan(0);
      for (const token of validIntent.reward.tokens) {
        expect(token.token).toBeDefined();
        expect(isAddress(token.token, { strict: false })).toBe(true);
        expect(token.amount).toBeDefined();
        expect(token.amount).toBeGreaterThan(0);
      }
    })

    test("validCustomTokens", async () => {
      const validIntent = routesService.createSimpleIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
        spendingTokenLimit: BigInt(10000000),
        receivingToken: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
        amount: BigInt(1000000),
        prover: 'HyperProver',
      });

      expect(validIntent).toBeDefined();
      expect(validIntent).toBeDefined();
      expect(validIntent.route).toBeDefined();
      expect(validIntent.route.salt).toBeDefined();
      expect(validIntent.route.source).toBeDefined();
      expect(validIntent.route.destination).toBeDefined();
      expect(validIntent.route.inbox).toBeDefined();
      expect(isAddress(validIntent.route.inbox, { strict: false })).toBe(true);
      expect(validIntent.route.calls).toBeDefined();
      expect(validIntent.route.calls.length).toBeGreaterThan(0);
      for (const call of validIntent.route.calls) {
        expect(call.target).toBeDefined();
        expect(isAddress(call.target, { strict: false })).toBe(true);
        expect(call.data).toBeDefined();
        expect(call.value).toBeDefined();
      }
      expect(validIntent.reward).toBeDefined();
      expect(validIntent.reward.creator).toBeDefined();
      expect(isAddress(validIntent.reward.creator, { strict: false })).toBe(true);
      expect(validIntent.reward.prover).toBeDefined();
      expect(isAddress(validIntent.reward.prover, { strict: false })).toBe(true);
      expect(validIntent.reward.deadline).toBeDefined();
      expect(validIntent.reward.nativeValue).toBeDefined();
      expect(validIntent.reward.tokens).toBeDefined();
      expect(validIntent.reward.tokens.length).toBeGreaterThan(0);
      for (const token of validIntent.reward.tokens) {
        expect(token.token).toBeDefined();
        expect(isAddress(token.token, { strict: false })).toBe(true);
        expect(token.amount).toBeDefined();
        expect(token.amount).toBeGreaterThan(0);
      }
    })

    test("validCreatorZeroAddress", async () => {
      const validIntent = routesService.createSimpleIntent({
        creator: zeroAddress,
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: RoutesService.getStableAddress(10, "USDC"),
        spendingTokenLimit: BigInt(10000000),
        receivingToken: RoutesService.getStableAddress(8453, "USDC"),
        amount: BigInt(1000000),
        prover: 'HyperProver',
      });

      expect(validIntent).toBeDefined();
      expect(validIntent).toBeDefined();
      expect(validIntent.route).toBeDefined();
      expect(validIntent.route.salt).toBeDefined();
      expect(validIntent.route.source).toBeDefined();
      expect(validIntent.route.destination).toBeDefined();
      expect(validIntent.route.inbox).toBeDefined();
      expect(isAddress(validIntent.route.inbox, { strict: false })).toBe(true);
      expect(validIntent.route.calls).toBeDefined();
      expect(validIntent.route.calls.length).toBeGreaterThan(0);
      for (const call of validIntent.route.calls) {
        expect(call.target).toBeDefined();
        expect(isAddress(call.target, { strict: false })).toBe(true);
        expect(call.data).toBeDefined();
        expect(call.value).toBeDefined();
      }
      expect(validIntent.reward).toBeDefined();
      expect(validIntent.reward.creator).toBeDefined();
      expect(isAddress(validIntent.reward.creator, { strict: false })).toBe(true);
      expect(validIntent.reward.prover).toBeDefined();
      expect(isAddress(validIntent.reward.prover, { strict: false })).toBe(true);
      expect(validIntent.reward.deadline).toBeDefined();
      expect(validIntent.reward.nativeValue).toBeDefined();
      expect(validIntent.reward.tokens).toBeDefined();
      expect(validIntent.reward.tokens.length).toBeGreaterThan(0);
      for (const token of validIntent.reward.tokens) {
        expect(token.token).toBeDefined();
        expect(isAddress(token.token, { strict: false })).toBe(true);
        expect(token.amount).toBeDefined();
        expect(token.amount).toBeGreaterThan(0);
      }
    })

    test("invalidCreator", async () => {
      expect(() => routesService.createSimpleIntent({
        creator: "0x",
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: RoutesService.getStableAddress(10, "USDC"),
        spendingTokenLimit: BigInt(10000000),
        receivingToken: RoutesService.getStableAddress(8453, "USDC"),
        amount: BigInt(1000000),
        prover: 'HyperProver',
      })).toThrow("Invalid creator address");
    })

    test("invalidRecipient", async () => {
      expect(() => routesService.createSimpleIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: RoutesService.getStableAddress(10, "USDC"),
        spendingTokenLimit: BigInt(10000000),
        receivingToken: RoutesService.getStableAddress(8453, "USDC"),
        amount: BigInt(1000000),
        prover: 'HyperProver',
        recipient: "0x"
      })).toThrow("Invalid recipient address");
    })

    test("invalidChainIDs", async () => {
      expect(() => routesService.createSimpleIntent({
        creator,
        originChainID: 10,
        destinationChainID: 10,
        spendingToken: RoutesService.getStableAddress(10, "USDC"),
        spendingTokenLimit: BigInt(10000000),
        receivingToken: RoutesService.getStableAddress(10, "USDC"),
        amount: BigInt(1000000),
        prover: 'HyperProver',
      })).toThrow("originChainID and destinationChainID cannot be the same");
    })

    test("invalidAmount", async () => {
      expect(() => routesService.createSimpleIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: RoutesService.getStableAddress(10, "USDC"),
        spendingTokenLimit: BigInt(10000000),
        receivingToken: RoutesService.getStableAddress(8453, "USDC"),
        amount: BigInt(-1),
        prover: 'HyperProver',
      })).toThrow("Invalid amount");
    })

    test("invalidSpendingTokenLimit", async () => {
      expect(() => routesService.createSimpleIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: RoutesService.getStableAddress(10, "USDC"),
        spendingTokenLimit: BigInt(999999),
        receivingToken: RoutesService.getStableAddress(8453, "USDC"),
        amount: BigInt(1000000),
        prover: 'HyperProver',
      })).toThrow("Insufficient spendingTokenLimit");
    })

    test("invalidExpiryTime", async () => {
      expect(() => routesService.createSimpleIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: RoutesService.getStableAddress(10, "USDC"),
        spendingTokenLimit: BigInt(10000000),
        receivingToken: RoutesService.getStableAddress(8453, "USDC"),
        amount: BigInt(1000000),
        prover: 'HyperProver',
        expiryTime: getSecondsFromNow(50),
      })).toThrow("Expiry time must be 60 seconds or more in the future");
    })

    test("invalidProverForChain", async () => {
      expect(() => routesService.createSimpleIntent({
        creator,
        originChainID: 42161,
        destinationChainID: 10,
        spendingToken: RoutesService.getStableAddress(42161, "USDC"),
        spendingTokenLimit: BigInt(10000000),
        receivingToken: RoutesService.getStableAddress(10, "USDC"),
        amount: BigInt(1000000),
        prover: "StorageProver",
      })).toThrow("No default prover found for this chain");
    })
  })

  describe("createIntent", () => {
    let transferData: Hex;

    beforeAll(() => {
      transferData = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [creator, BigInt(1000000)]
      })
    })

    test("valid", async () => {
      const validIntent = routesService.createIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        calls: [{
          target: RoutesService.getStableAddress(8453, "USDC"),
          data: transferData,
          value: BigInt(0),
        }],
        callTokens: [{
          token: RoutesService.getStableAddress(8453, "USDC"),
          amount: BigInt(1000000),
        }],
        tokens: [{
          token: RoutesService.getStableAddress(10, "USDC"),
          amount: BigInt(1000000),
        }],
        prover: "HyperProver",
      })

      expect(validIntent).toBeDefined();
      expect(validIntent).toBeDefined();
      expect(validIntent.route).toBeDefined();
      expect(validIntent.route.salt).toBeDefined();
      expect(validIntent.route.source).toBeDefined();
      expect(validIntent.route.destination).toBeDefined();
      expect(validIntent.route.inbox).toBeDefined();
      expect(isAddress(validIntent.route.inbox, { strict: false })).toBe(true);
      expect(validIntent.route.calls).toBeDefined();
      expect(validIntent.route.calls.length).toBeGreaterThan(0);
      for (const call of validIntent.route.calls) {
        expect(call.target).toBeDefined();
        expect(isAddress(call.target, { strict: false })).toBe(true);
        expect(call.data).toBeDefined();
        expect(call.value).toBeDefined();
      }
      expect(validIntent.reward).toBeDefined();
      expect(validIntent.reward.creator).toBeDefined();
      expect(isAddress(validIntent.reward.creator, { strict: false })).toBe(true);
      expect(validIntent.reward.prover).toBeDefined();
      expect(isAddress(validIntent.reward.prover, { strict: false })).toBe(true);
      expect(validIntent.reward.deadline).toBeDefined();
      expect(validIntent.reward.nativeValue).toBeDefined();
      expect(validIntent.reward.tokens).toBeDefined();
      expect(validIntent.reward.tokens.length).toBeGreaterThan(0);
      for (const token of validIntent.reward.tokens) {
        expect(token.token).toBeDefined();
        expect(isAddress(token.token, { strict: false })).toBe(true);
        expect(token.amount).toBeDefined();
        expect(token.amount).toBeGreaterThan(0);
      }
    })

    test("validCustomTokens", async () => {
      const validIntent = routesService.createIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        calls: [{
          target: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
          data: transferData,
          value: BigInt(0),
        }],
        callTokens: [{
          token: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
          amount: BigInt(1000000),
        }],
        tokens: [{
          token: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
          amount: BigInt(1000000),
        }],
        prover: "HyperProver",
      })

      expect(validIntent).toBeDefined();
      expect(validIntent).toBeDefined();
      expect(validIntent.route).toBeDefined();
      expect(validIntent.route.salt).toBeDefined();
      expect(validIntent.route.source).toBeDefined();
      expect(validIntent.route.destination).toBeDefined();
      expect(validIntent.route.inbox).toBeDefined();
      expect(isAddress(validIntent.route.inbox, { strict: false })).toBe(true);
      expect(validIntent.route.calls).toBeDefined();
      expect(validIntent.route.calls.length).toBeGreaterThan(0);
      for (const call of validIntent.route.calls) {
        expect(call.target).toBeDefined();
        expect(isAddress(call.target, { strict: false })).toBe(true);
        expect(call.data).toBeDefined();
        expect(call.value).toBeDefined();
      }
      expect(validIntent.reward).toBeDefined();
      expect(validIntent.reward.creator).toBeDefined();
      expect(isAddress(validIntent.reward.creator, { strict: false })).toBe(true);
      expect(validIntent.reward.prover).toBeDefined();
      expect(isAddress(validIntent.reward.prover, { strict: false })).toBe(true);
      expect(validIntent.reward.deadline).toBeDefined();
      expect(validIntent.reward.nativeValue).toBeDefined();
      expect(validIntent.reward.tokens).toBeDefined();
      expect(validIntent.reward.tokens.length).toBeGreaterThan(0);
      for (const token of validIntent.reward.tokens) {
        expect(token.token).toBeDefined();
        expect(isAddress(token.token, { strict: false })).toBe(true);
        expect(token.amount).toBeDefined();
        expect(token.amount).toBeGreaterThan(0);
      }
    })

    test("invalidCreator", async () => {
      expect(() => routesService.createIntent({
        creator: "0x",
        originChainID: 10,
        destinationChainID: 8453,
        calls: [{
          target: RoutesService.getStableAddress(8453, "USDC"),
          data: transferData,
          value: BigInt(0),
        }],
        callTokens: [{
          token: RoutesService.getStableAddress(8453, "USDC"),
          amount: BigInt(1000000),
        }],
        tokens: [{
          token: RoutesService.getStableAddress(10, "USDC"),
          amount: BigInt(1000000),
        }],
        prover: "HyperProver",
      })).toThrow("Invalid creator address");
    })

    test("invalidChainIDs", async () => {
      expect(() => routesService.createIntent({
        creator,
        originChainID: 10,
        destinationChainID: 10,
        calls: [{
          target: RoutesService.getStableAddress(10, "USDC"),
          data: transferData,
          value: BigInt(0),
        }],
        callTokens: [{
          token: RoutesService.getStableAddress(10, "USDC"),
          amount: BigInt(1000000),
        }],
        tokens: [{
          token: RoutesService.getStableAddress(10, "USDC"),
          amount: BigInt(1000000),
        }],
        prover: "HyperProver",
      })).toThrow("originChainID and destinationChainID cannot be the same");
    })

    test("invalidExpiryTime", async () => {
      expect(() => routesService.createIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        calls: [{
          target: RoutesService.getStableAddress(8453, "USDC"),
          data: transferData,
          value: BigInt(0),
        }],
        callTokens: [{
          token: RoutesService.getStableAddress(8453, "USDC"),
          amount: BigInt(1000000),
        }],
        tokens: [{
          token: RoutesService.getStableAddress(10, "USDC"),
          amount: BigInt(1000000),
        }],
        prover: "HyperProver",
        expiryTime: getSecondsFromNow(50),
      })).toThrow("Expiry time must be 60 seconds or more in the future");
    })

    test("invalidTokens", async () => {
      expect(() => routesService.createIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        calls: [{
          target: RoutesService.getStableAddress(8453, "USDC"),
          data: transferData,
          value: BigInt(0),
        }],
        callTokens: [{
          token: RoutesService.getStableAddress(8453, "USDC"),
          amount: BigInt(1000000),
        }],
        tokens: [{
          token: RoutesService.getStableAddress(10, "USDC"),
          amount: BigInt(-1),
        }],
        prover: "HyperProver",
      })).toThrow("Invalid tokens");

      expect(() => routesService.createIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        calls: [{
          target: RoutesService.getStableAddress(8453, "USDC"),
          data: transferData,
          value: BigInt(0),
        }],
        callTokens: [{
          token: RoutesService.getStableAddress(8453, "USDC"),
          amount: BigInt(100000)
        }],
        tokens: [],
        prover: "HyperProver",
      })).toThrow("Invalid tokens");

      expect(() => routesService.createIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        calls: [{
          target: RoutesService.getStableAddress(8453, "USDC"),
          data: transferData,
          value: BigInt(0),
        }],
        callTokens: [{
          token: RoutesService.getStableAddress(8453, "USDC"),
          amount: BigInt(1000000)
        }],
        tokens: [{
          token: "0x",
          amount: BigInt(1000000),
        }],
        prover: "HyperProver",
      })).toThrow("Invalid tokens");
    })

    test("invalidCallTokens", async () => {
      expect(() => routesService.createIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        calls: [{
          target: RoutesService.getStableAddress(8453, "USDC"),
          data: transferData,
          value: BigInt(0),
        }],
        callTokens: [{
          token: RoutesService.getStableAddress(8453, "USDC"),
          amount: BigInt(-1),
        }],
        tokens: [{
          token: RoutesService.getStableAddress(10, "USDC"),
          amount: BigInt(1000000),
        }],
        prover: "HyperProver",
      })).toThrow("Invalid callTokens");

      expect(() => routesService.createIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        calls: [{
          target: RoutesService.getStableAddress(8453, "USDC"),
          data: transferData,
          value: BigInt(0),
        }],
        callTokens: [],
        tokens: [{
          token: RoutesService.getStableAddress(10, "USDC"),
          amount: BigInt(1000000),
        }],
        prover: "HyperProver",
      })).toThrow("Invalid callTokens");

      expect(() => routesService.createIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        calls: [{
          target: RoutesService.getStableAddress(8453, "USDC"),
          data: transferData,
          value: BigInt(0),
        }],
        callTokens: [{
          token: "0x",
          amount: BigInt(100000)
        }],
        tokens: [{
          token: RoutesService.getStableAddress(10, "USDC"),
          amount: BigInt(1000000),
        }],
        prover: "HyperProver",
      })).toThrow("Invalid callTokens");
    })

    test("invalidCalls", async () => {
      expect(() => routesService.createIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        calls: [{
          target: "0x0",
          data: transferData,
          value: BigInt(0),
        }],
        callTokens: [{
          token: RoutesService.getStableAddress(8453, "USDC"),
          amount: BigInt(1000000),
        }],
        tokens: [{
          token: RoutesService.getStableAddress(10, "USDC"),
          amount: BigInt(1000000),
        }],
        prover: "HyperProver",
      })).toThrow("Invalid calls");

      expect(() => routesService.createIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        calls: [{
          target: RoutesService.getStableAddress(8453, "USDC"),
          data: transferData,
          value: BigInt(-1),
        }],
        callTokens: [{
          token: RoutesService.getStableAddress(8453, "USDC"),
          amount: BigInt(1000000),
        }],
        tokens: [{
          token: RoutesService.getStableAddress(10, "USDC"),
          amount: BigInt(1000000),
        }],
        prover: "HyperProver",
      })).toThrow("Invalid calls");

      expect(() => routesService.createIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        calls: [],
        callTokens: [{
          token: RoutesService.getStableAddress(8453, "USDC"),
          amount: BigInt(1000000),
        }],
        tokens: [{
          token: RoutesService.getStableAddress(10, "USDC"),
          amount: BigInt(1000000),
        }],
        prover: "HyperProver",
      })).toThrow("Invalid calls");
    })

    test("invalidProverForChain", async () => {
      expect(() => routesService.createIntent({
        creator,
        originChainID: 42161,
        destinationChainID: 10,
        calls: [{
          target: RoutesService.getStableAddress(10, "USDC"),
          data: transferData,
          value: BigInt(0),
        }],
        callTokens: [{
          token: RoutesService.getStableAddress(10, "USDC"),
          amount: BigInt(1000000),
        }],
        tokens: [{
          token: RoutesService.getStableAddress(42161, "USDC"),
          amount: BigInt(1000000),
        }],
        prover: "StorageProver",
      })).toThrow("No default prover found for this chain");
    })
  })

  describe("applyQuoteToIntent", () => {
    let validIntent: IntentType;
    let validQuote: SolverQuote;

    beforeAll(() => {
      validIntent = routesService.createSimpleIntent({
        creator,
        originChainID: 10,
        destinationChainID: 8453,
        spendingToken: RoutesService.getStableAddress(10, "USDC"),
        spendingTokenLimit: BigInt(10000000),
        receivingToken: RoutesService.getStableAddress(8453, "USDC"),
        amount: BigInt(1000000),
        prover: 'HyperProver',

      });
    })

    beforeEach(() => {
      validQuote = {
        receiveSignedIntentUrl: "https://example.com/endpoint",
        intentSourceContract: EcoProtocolAddresses[10].IntentSource,
        quoteData: {
          tokens: [{
            token: RoutesService.getStableAddress(10, "USDC"),
            amount: "1000000",
          }],
          expiryTime: dateToTimestamp(getSecondsFromNow(60)).toString()
        }
      };
    });

    test("valid", () => {
      const intent = routesService.applyQuoteToIntent({ intent: validIntent, quote: validQuote });

      expect(intent).toBeDefined();
      expect(intent).toBeDefined();
      expect(intent.route).toBeDefined();
      expect(intent.route.salt).toBeDefined();
      expect(intent.route.source).toBeDefined();
      expect(intent.route.destination).toBeDefined();
      expect(intent.route.inbox).toBeDefined();
      expect(isAddress(intent.route.inbox, { strict: false })).toBe(true);
      expect(intent.route.calls).toBeDefined();
      expect(intent.route.calls.length).toBeGreaterThan(0);
      for (const call of intent.route.calls) {
        expect(call.target).toBeDefined();
        expect(isAddress(call.target, { strict: false })).toBe(true);
        expect(call.data).toBeDefined();
        expect(call.value).toBeDefined();
      }
      expect(intent.reward).toBeDefined();
      expect(intent.reward.creator).toBeDefined();
      expect(isAddress(intent.reward.creator, { strict: false })).toBe(true);
      expect(intent.reward.prover).toBeDefined();
      expect(isAddress(intent.reward.prover, { strict: false })).toBe(true);
      expect(intent.reward.deadline).toBeDefined();
      expect(intent.reward.nativeValue).toBeDefined();
      expect(intent.reward.tokens).toBeDefined();
      expect(intent.reward.tokens.length).toBeGreaterThan(0);

      for (const token of intent.reward.tokens) {
        expect(token.token).toBeDefined();
        expect(isAddress(token.token, { strict: false })).toBe(true);
        expect(token.amount).toBeDefined();
        expect(token.amount).toBeGreaterThan(0);
      }
    });

    test("invalid quote data", () => {
      const intent = validIntent;
      const quote: SolverQuote = {
        ...validQuote,
        quoteData: {
          ...validQuote.quoteData,
          tokens: [],
        }
      };

      expect(() => routesService.applyQuoteToIntent({ intent, quote })).toThrow("Invalid quoteData: tokens array must have length greater than 0");
    });
  });
})
