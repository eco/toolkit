import { SolverQuote } from "../types";

export function selectCheapestQuote(quotes: SolverQuote[]): SolverQuote {
  return quotes.reduce((cheapest, quote) => {
    const cheapestSum = cheapest ? cheapest.quoteData.rewardTokenAmounts.reduce((sum, amount) => sum + BigInt(amount), BigInt(0)) : BigInt(Infinity);
    const quoteSum = quote.quoteData.rewardTokenAmounts.reduce((sum, amount) => sum + BigInt(amount), BigInt(0));
    return quoteSum < cheapestSum ? quote : cheapest;
  });
}
