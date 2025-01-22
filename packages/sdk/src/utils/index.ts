export function getSecondsFromNow(seconds: number): Date {
  return new Date(Date.now() + 1000 * seconds)
}

export function dateToTimestap(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

export function isAmountInvalid(amount: bigint): boolean {
  return amount < BigInt(0);
}
