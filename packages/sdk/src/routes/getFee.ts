import { IntentType } from "@eco-foundation/routes-ts";
import { formatUnits } from "viem";

/**
 * Get the fee for an intent
 * 
 * @param intent - The intent object containing route and reward tokens
 * @returns a string of the fee in formatted dollars
 * @throws Error if the reward tokens sum is strictly less than the route tokens sum
 */
export function getFee(intent: IntentType): string {
  // fee calculated as sum of reward tokens sub sum of route tokens
  const routeTokensSum = intent.route.tokens.reduce((acc, token) => acc + BigInt(token.amount), BigInt(0));
  const rewardTokensSum = intent.reward.tokens.reduce((acc, token) => acc + BigInt(token.amount), BigInt(0));
  if (rewardTokensSum < routeTokensSum) {
    throw new Error("Reward tokens sum should never be less than route tokens sum");
  }
  return formatUnits(rewardTokensSum - routeTokensSum, 6);
}