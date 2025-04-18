
import { expect } from "vitest";
import { INTENT_EXECUTION_TYPES, SolverQuote } from "../src";
import { hashIntent, hashRoute, IntentType } from "@eco-foundation/routes-ts";
import { decodeFunctionData, erc20Abi, Hex, encodePacked } from "viem";
import { sum } from "../src/utils";

export function validateSolverQuoteResponse(quoteResponse: SolverQuote, originalIntent: IntentType, isReverseQuote: boolean) {
  expect(quoteResponse.solverID).toBeDefined();
  expect(quoteResponse.quoteData).toBeDefined();
  expect(quoteResponse.quoteData.quoteEntries).toBeDefined();
  expect(quoteResponse.quoteData.quoteEntries.length).toBeGreaterThan(0);

  for (const quote of quoteResponse.quoteData.quoteEntries) {
    expect(quote).toBeDefined();
    expect(quote.intentExecutionType).toBeDefined();
    expect(quote.intentExecutionType).toBeOneOf([...INTENT_EXECUTION_TYPES]);
    expect(quote.expiryTime).toBeDefined();
    expect(quote.intentData).toBeDefined();

    expect(quote.intentData.reward).toBeDefined();
    expect(quote.intentData.reward.creator).toBeDefined();
    expect(quote.intentData.reward.prover).toBeDefined();
    expect(quote.intentData.reward.deadline).toBeDefined();
    expect(quote.intentData.reward.nativeValue).toBeDefined();
    expect(quote.intentData.reward.tokens).toBeDefined();
    expect(quote.intentData.reward.tokens.length).toBeGreaterThan(0);
    for (const token of quote.intentData.reward.tokens) {
      expect(token).toBeDefined();
      expect(token.amount).toBeDefined();
      expect(token.amount).toBeGreaterThan(0n);
      expect(token.token).toBeDefined();
    }

    expect(quote.intentData.route).toBeDefined();
    expect(quote.intentData.route.salt).toBeDefined();
    expect(quote.intentData.route.source).toBeDefined();
    expect(quote.intentData.route.destination).toBeDefined();
    expect(quote.intentData.route.inbox).toBeDefined();
    expect(quote.intentData.route.tokens).toBeDefined();
    expect(quote.intentData.route.tokens.length).toBeGreaterThan(0);
    for (const token of quote.intentData.route.tokens) {
      expect(token).toBeDefined();
      expect(token.amount).toBeDefined();
      expect(token.amount).toBeGreaterThan(0n);
      expect(token.token).toBeDefined();
    }
    expect(quote.intentData.route.calls).toBeDefined();
    expect(quote.intentData.route.calls.length).toBeGreaterThan(0);
    for (const call of quote.intentData.route.calls) {
      expect(call).toBeDefined();
      expect(call.target).toBeDefined();
      expect(call.data).toBeDefined();
      expect(call.value).toBeDefined();
    }

    // Validate that quotes are applied correctly based on the quote method
    if (isReverseQuote) {
      // For reverse quotes:
      // 1. Validate all calls are ERC20 transfers and the overall amount is less than the original intent
      const quoteCallsSum = sum(quote.intentData.route.calls.map(call => {
        const decodedCall = decodeFunctionData({ data: call.data, abi: erc20Abi });
        expect(decodedCall.functionName).toBe("transfer");
        return BigInt(decodedCall.args[1]!);
      }));
      const intentCallsSum = sum(originalIntent.route.calls.map(call => {
        const decodedCall = decodeFunctionData({ data: call.data, abi: erc20Abi });
        expect(decodedCall.functionName).toBe("transfer");
        return BigInt(decodedCall.args[1]!);
      }));
      expect(quoteCallsSum, "Reverse quote should reduce route.calls sum").toBeLessThanOrEqual(intentCallsSum);

      // 2. Verify quote is applied to route tokens
      const quoteTokensSum = sum(quote.intentData.route.tokens.map(token => token.amount));
      const intentTokensSum = sum(originalIntent.route.tokens.map(token => token.amount));
      expect(quoteTokensSum, "Reverse quote should reduce route.tokens sum").toBeLessThanOrEqual(intentTokensSum);

      // 3. Reward tokens should remain unchanged
      const quoteRewardTokensSum = sum(quote.intentData.reward.tokens.map(token => token.amount));
      const intentRewardTokensSum = sum(originalIntent.reward.tokens.map(token => token.amount));
      expect(quoteRewardTokensSum, "Reverse quote should not change reward.tokens sum").toBe(
        intentRewardTokensSum,
      );
    } else {
      // For standard quotes:
      // 1. Verify quote reduces asked reward tokens or keeps it the same
      const quoteRewardTokensSum = sum(quote.intentData.reward.tokens.map(token => token.amount));
      const intentRewardTokensSum = sum(originalIntent.reward.tokens.map(token => token.amount));
      expect(quoteRewardTokensSum, "Standard quote should reducs reward.tokens sum").toBeLessThanOrEqual(
        intentRewardTokensSum,
      );

      // 2. Route token amounts should remain unchanged
      const quoteRouteTokensSum = sum(quote.intentData.route.tokens.map(token => token.amount));
      const intentRouteTokensSum = sum(originalIntent.route.tokens.map(token => token.amount));
      expect(quoteRouteTokensSum, "Standard quote should not change route.tokens sum").toBe(
        intentRouteTokensSum,
      );
    }

    // Verify that the quote reward tokens sum is equal to or greater than the route tokens sum
    const quoteRewardTokensSum = sum(quote.intentData.reward.tokens.map(token => token.amount));
    const quoteRouteTokensSum = sum(quote.intentData.route.tokens.map(token => token.amount));
    expect(quoteRewardTokensSum, "Quote reward tokens sum should be greater than or equal to route tokens sum").toBeGreaterThanOrEqual(
      quoteRouteTokensSum,
    );
  }
}
