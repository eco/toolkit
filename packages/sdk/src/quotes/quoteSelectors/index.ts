import { sum } from "../../utils";
import { SolverQuote } from "../types";

export function selectCheapestQuote(quotes: SolverQuote[]): SolverQuote {
  return quotes.reduce((cheapest, quote) => {
    const cheapestSum = cheapest ? sum(cheapest.quoteData.tokens.map(({ balance }) => balance)) : BigInt(Infinity);
    const quoteSum = sum(quote.quoteData.tokens.map(({ balance }) => balance));
    return quoteSum < cheapestSum ? quote : cheapest;
  });
}
