export function getSecondsFromNow(seconds: number): Date {
  return new Date(Date.now() + 1000 * seconds)
}
