import { RoutesSupportedChainId, SolverQuote } from "@eco-foundation/routes-sdk"
import { IntentType } from "@eco-foundation/routes-ts"
import { formatUnits } from "viem"
import { findTokenByAddress } from "../../../utils"

type Props = {
  intent: IntentType | undefined,
  quotes: SolverQuote[] | undefined,
  onQuoteSelected: (quote: SolverQuote) => void
}

export default function SelectQuote({ intent, quotes, onQuoteSelected }: Props) {
  if (!intent || !quotes) return null

  return (
    <div className="m-4">
      <span className="text-2xl">Quotes Available:</span>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          {quotes.map((quote, index) => (
            <div key={`quote-${index}`} className="p-2 border-1 flex flex-col">
              <span>Amounts requested by solver on the origin chain:</span>
              <ul className="list-disc">
                {quote.quoteData.tokens.map((token) => (
                  <li key={token.token} className="ml-4">{formatUnits(BigInt(token.amount), 6)} {findTokenByAddress(Number(intent.route.source) as RoutesSupportedChainId, token.token)?.id}</li>
                ))}
              </ul>
              <span>Quote expires at: {new Date(Number(quote.quoteData.expiryTime) * 1000).toISOString()}</span>
              <span>Estimated time to fulfill: {quote.quoteData.estimatedFulfillTimeSec} seconds</span>
              <button onClick={() => onQuoteSelected(quote)}>Select Quote</button>
            </div>
          ))}
        </div>
        <div className="h-full">
          <pre className="h-full">
            {
              `const quotes = await openQuotingClient.requestQuotesForIntent(intent);
          
console.log(quotes);
${JSON.stringify(quotes, null, 2)}`}
          </pre>
        </div>
      </div>

    </div>
  )
}