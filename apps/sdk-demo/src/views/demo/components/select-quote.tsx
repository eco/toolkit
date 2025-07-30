import { RoutesSupportedChainId, SolverQuote, selectCheapestQuote, selectCheapestQuoteNativeSend } from "@eco-foundation/routes-sdk"
import { IntentType } from "@eco-foundation/routes-ts"
import { formatUnits } from "viem"
import { TokenDisplay } from "./token-display"

type Props = {
  intent: IntentType | undefined,
  quotes: SolverQuote[] | undefined,
  isNativeIntent: boolean,
  onQuoteSelected: (quote: SolverQuote) => void
}

export default function SelectQuote({ intent, quotes, isNativeIntent, onQuoteSelected }: Props) {
  if (!intent || !quotes) return null

  const handleSelectCheapest = () => {
    const cheapestQuote = isNativeIntent ?
      selectCheapestQuoteNativeSend(quotes) :
      selectCheapestQuote(quotes);
    onQuoteSelected(cheapestQuote);
  };

  return (
    <div className="m-4">
      <span className="text-2xl">Quotes Available:</span>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSelectCheapest}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Select Cheapest Quote {isNativeIntent ? '(Native Value)' : '(Token Amount)'}
          </button>
          {quotes.map((quote, index) => (
            <div key={`quote-${index}`} className="p-2 border-1 flex flex-col">
              <span>Amounts requested by solver on the origin chain:</span>
              {isNativeIntent ? (
                <div className="ml-4">
                  <span>Native Value: {formatUnits(BigInt(quote.quoteData.nativeValue || 0), 18)} ETH</span>
                </div>
              ) : (
                <ul className="list-disc">
                  {quote.quoteData.tokens.map((token) => <TokenDisplay key={token.token} chainId={Number(intent.route.source) as RoutesSupportedChainId} token={token} />)}
                </ul>
              )}
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

// Select the cheapest quote
const selectedQuote = ${isNativeIntent ? 'selectCheapestQuoteNativeSend' : 'selectCheapestQuote'}(quotes);
          
console.log(quotes);
${JSON.stringify(quotes, null, 2)}`}
          </pre>
        </div>
      </div>

    </div>
  )
}