import { sum } from "../../utils";
import { SolverQuote } from "../types";

export function selectCheapestQuote(quotes: SolverQuote[]): SolverQuote {
  return quotes.reduce((cheapest, quote) => {
    const cheapestSum = cheapest ? sum(cheapest.quoteData.rewardTokenAmounts) : BigInt(Infinity);
    const quoteSum = sum(quote.quoteData.rewardTokenAmounts);
    return quoteSum < cheapestSum ? quote : cheapest;
  });
}
