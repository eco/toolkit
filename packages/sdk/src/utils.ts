import { randomBytes } from "crypto";
import { Hex } from "viem";

export function getSecondsFromNow(seconds: number): Date {
  return new Date(Date.now() + 1000 * seconds)
}

export function dateToTimestamp(date: Date): bigint {
  return BigInt(Math.floor(date.getTime() / 1000));
}

export function isAmountInvalid(amount: bigint): boolean {
  return amount < BigInt(0);
}

export function sum(items: (bigint | string | number)[]): bigint {
  return items.reduce<bigint>((acc, amount) => acc + BigInt(amount), BigInt(0))
}

export function generateRandomHex(length = 32): Hex {
  return `0x${randomBytes(length).toString('hex')}`
}
