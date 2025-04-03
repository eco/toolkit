import { INTENT_EXECUTION_TYPES, IntentExecutionType } from "../../constants";
import { sum } from "../../utils";
import { QuoteData, SolverQuote } from "../types";

type QuoteSelectorResult = {
  solverID: string;
  quoteData: QuoteData;
}

export function selectCheapestQuote(solverQuotes: SolverQuote[], isReverse: boolean = false, allowedIntentExecutionTypes: IntentExecutionType[] = [...INTENT_EXECUTION_TYPES]): QuoteSelectorResult {
  return solverQuotes.reduce<QuoteSelectorResult>(({ solverID: cheapestSolverID, quoteData: cheapestQuoteData }, solverQuoteResponse) => {
    const quotes = solverQuoteResponse.quoteData.quoteEntries;
    for (const quoteData of quotes) {
      if (allowedIntentExecutionTypes.includes(quoteData.intentExecutionType)) {
        let cheapestTokens = cheapestQuoteData.intentData.reward.tokens;
        let quoteTokens = quoteData.intentData.reward.tokens;
        const defaultSum = BigInt(isReverse ? 0 : Infinity);
        if (isReverse) {
          cheapestTokens = cheapestQuoteData.intentData.route.tokens;
          quoteTokens = quoteData.intentData.route.tokens;
        }

        const cheapestSum = cheapestQuoteData ? sum(cheapestTokens.map(({ amount }) => amount)) : defaultSum;
        const quoteSum = sum(quoteTokens.map(({ amount }) => amount));

        if (isReverse) {
          // want to set the quote with the highest route tokens sum (most received on destination chain)
          return quoteSum > cheapestSum ? {
            solverID: solverQuoteResponse.solverID,
            quoteData
          } : {
            solverID: cheapestSolverID,
            quoteData: cheapestQuoteData
          };
        }
        else {
          // want to set the quote with the lowest reward tokens sum (least spent on origin chain)
          return quoteSum < cheapestSum ? {
            solverID: solverQuoteResponse.solverID,
            quoteData
          } : {
            solverID: cheapestSolverID,
            quoteData: cheapestQuoteData
          } as QuoteSelectorResult;
        }
      }
    }
    return {
      solverID: cheapestSolverID,
      quoteData: cheapestQuoteData
    }
  }, {} as QuoteSelectorResult);
}