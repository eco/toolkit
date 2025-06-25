import { sum } from "../utils.js";
import { QuoteSelectorOptions, QuoteSelectorResult, SolverQuote } from "./types.js";

export function selectCheapestQuote(solverQuotes: SolverQuote[], options: QuoteSelectorOptions = {}): QuoteSelectorResult {
  const { isReverse = false, allowedIntentExecutionTypes = ["SELF_PUBLISH"] } = options;

  const flatQuotes = solverQuotes.flatMap(solverQuote =>
    solverQuote.quoteData.quoteEntries
      .filter(quoteEntry => allowedIntentExecutionTypes.includes(quoteEntry.intentExecutionType))
      .map(quoteEntry => ({
        solverID: solverQuote.solverID,
        quoteID: solverQuote.quoteID,
        quote: quoteEntry
      }))
  );

  if (flatQuotes.length === 0) {
    throw new Error('No valid quotes found');
  }

  return flatQuotes.reduce((cheapest, current) => {
    const currentTokens = isReverse ? current.quote.intentData.route.tokens : current.quote.intentData.reward.tokens;
    const cheapestTokens = isReverse ? cheapest.quote.intentData.route.tokens : cheapest.quote.intentData.reward.tokens;

    const currentSum = sum(currentTokens.map(({ amount }) => amount));
    const cheapestSum = sum(cheapestTokens.map(({ amount }) => amount));

    if (isReverse) {
      return currentSum > cheapestSum ? current : cheapest;
    } else {
      return currentSum < cheapestSum ? current : cheapest;
    }
  });
}

export function selectCheapestQuoteNativeSend(solverQuotes: SolverQuote[], options: QuoteSelectorOptions = {}): QuoteSelectorResult {
  const { isReverse = false, allowedIntentExecutionTypes = ["SELF_PUBLISH"] } = options;

  const flatQuotes = solverQuotes.flatMap(solverQuote =>
    solverQuote.quoteData.quoteEntries
      .filter(quoteEntry => allowedIntentExecutionTypes.includes(quoteEntry.intentExecutionType))
      .map(quoteEntry => ({
        solverID: solverQuote.solverID,
        quoteID: solverQuote.quoteID,
        quote: quoteEntry
      }))
  );

  if (flatQuotes.length === 0) {
    throw new Error('No valid quotes found');
  }

  return flatQuotes.reduce((cheapest, current) => {
    const currentNativeValue = current.quote.intentData.reward.nativeValue;
    const cheapestNativeValue = cheapest.quote.intentData.reward.nativeValue;

    if (isReverse) {
      return currentNativeValue > cheapestNativeValue ? current : cheapest;
    } else {
      return currentNativeValue < cheapestNativeValue ? current : cheapest;
    }
  });
}
