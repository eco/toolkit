import { sum } from "../utils.js";
import { SolverQuote } from "./types.js";

export function selectCheapestQuote(quotes: SolverQuote[]): SolverQuote {
  return quotes.reduce((cheapest, quote) => {
    const cheapestSum = cheapest ? sum(cheapest.quoteData.tokens.map(({ amount }) => amount)) : BigInt(Infinity);
    const quoteSum = sum(quote.quoteData.tokens.map(({ amount }) => amount));
    return quoteSum < cheapestSum ? quote : cheapest;
  });
}
