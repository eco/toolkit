import { IntentExecutionType } from "../../constants";
import { sum } from "../../utils";
import { QuoteData, SolverQuote } from "../types";

type QuoteSelectorResult = {
  solverID: string;
  quoteData: QuoteData;
}

export function selectCheapestQuote(solverQuotes: SolverQuote[], isReverse: boolean = false, allowedIntentExecutionTypes: IntentExecutionType[] = ["SELF_PUBLISH"]): QuoteSelectorResult {
  return solverQuotes.reduce<QuoteSelectorResult>(({ solverID: cheapestSolverID, quoteData: cheapestQuoteData }, solverQuoteResponse) => {
    const quotes = solverQuoteResponse.quoteData.quoteEntries;
    let localCheapestQuoteData = cheapestQuoteData;
    let localCheapestSolverID = cheapestSolverID;
    const defaultSum = BigInt(isReverse ? 0 : Number.MAX_SAFE_INTEGER);

    for (const quoteData of quotes) {
      if (allowedIntentExecutionTypes.includes(quoteData.intentExecutionType)) {
        let localCheapestTokens = localCheapestQuoteData?.intentData?.reward.tokens;
        let quoteTokens = quoteData.intentData.reward.tokens;

        if (isReverse) {
          localCheapestTokens = localCheapestQuoteData?.intentData?.route.tokens;
          quoteTokens = quoteData.intentData.route.tokens;
        }

        const localCheapestSum = localCheapestQuoteData ? sum(localCheapestTokens.map(({ amount }) => amount)) : defaultSum;
        const quoteSum = sum(quoteTokens.map(({ amount }) => amount));

        if (isReverse) {
          // want to set the quote with the highest route tokens sum (most received on destination chain)
          if (quoteSum > localCheapestSum) {
            localCheapestSolverID = solverQuoteResponse.solverID;
            localCheapestQuoteData = quoteData;
          }
        }
        else {
          // want to set the quote with the lowest reward tokens sum (least spent on origin chain)
          if (quoteSum < localCheapestSum) {
            localCheapestSolverID = solverQuoteResponse.solverID;
            localCheapestQuoteData = quoteData;
          }
        }
      }
    }

    // After iterating through all quotes for this solver, compare the local cheapest with the global cheapest
    if (!cheapestQuoteData) {
      return {
        solverID: localCheapestSolverID,
        quoteData: localCheapestQuoteData
      };
    }

    if (isReverse) {
      const globalTokens = cheapestQuoteData.intentData.route.tokens;
      const localTokens = localCheapestQuoteData?.intentData?.route.tokens;

      const globalSum = sum(globalTokens.map(({ amount }) => amount));
      const localSum = localCheapestQuoteData ? sum(localTokens.map(({ amount }) => amount)) : defaultSum;

      return localSum > globalSum ? {
        solverID: localCheapestSolverID,
        quoteData: localCheapestQuoteData
      } : {
        solverID: cheapestSolverID,
        quoteData: cheapestQuoteData
      };
    } else {
      const globalTokens = cheapestQuoteData.intentData.reward.tokens;
      const localTokens = localCheapestQuoteData?.intentData?.reward.tokens;

      const globalSum = sum(globalTokens.map(({ amount }) => amount));
      const localSum = localCheapestQuoteData ? sum(localTokens.map(({ amount }) => amount)) : defaultSum;

      return localSum < globalSum ? {
        solverID: localCheapestSolverID,
        quoteData: localCheapestQuoteData
      } : {
        solverID: cheapestSolverID,
        quoteData: cheapestQuoteData
      };
    }
  }, {} as QuoteSelectorResult);
}