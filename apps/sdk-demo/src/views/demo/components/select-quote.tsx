import { RoutesSupportedChainId, SolverQuote, selectCheapestQuote, selectCheapestQuoteNativeSend } from "@eco-foundation/routes-sdk"
import { IntentType } from "@eco-foundation/routes-ts"
import { formatUnits } from "viem"
import { findTokenByAddress, replaceBigIntsWithStrings } from "../../../utils"

type Props = {
  intent: IntentType | undefined,
  quotes: SolverQuote[] | undefined,
  isNativeIntent: boolean,
  onQuoteSelected: (quote: SolverQuote) => void,
  quoteType: "receive" | "spend"
}

export default function SelectQuote({ intent, quotes, isNativeIntent, onQuoteSelected, quoteType }: Props) {
  if (!intent || !quotes) return null

  const handleSelectCheapest = () => {
    const cheapestQuote = isNativeIntent ?
      selectCheapestQuoteNativeSend(quotes) :
      selectCheapestQuote(quotes);
    const solverQuote = quotes.find(q => q.quoteID === cheapestQuote.quoteID && q.solverID === cheapestQuote.solverID);
    if (solverQuote) {
      onQuoteSelected(solverQuote);
    }
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
            <div key={`quote-${index}`} className="p-4 border border-gray-200 rounded-md flex flex-col gap-3">
              <div className="text-lg font-semibold">
                <div><span className="font-bold">Quote ID:</span> {quote.quoteID}</div>
                <div><span className="font-bold">Solver ID:</span> {quote.solverID}</div>
              </div>

              {quote.quoteData.quoteEntries.map((entry, entryIndex) => (
                <div key={`entry-${entryIndex}`} className="border-t border-gray-200 pt-3 mt-1">
                  <h3 className="text-md font-semibold mb-2">Quote Entry {entryIndex + 1}</h3>

                  <div className="mb-2">
                    <span className="font-bold">Execution Type:</span> {entry.intentExecutionType}
                  </div>

                  {quoteType === "receive" ? (
                    <div className="mb-2">
                      <div className="font-medium">Origin Chain Tokens (Requested):</div>
                      {isNativeIntent ? (
                        <div className="ml-4">
                          <span>Native Value: {formatUnits(BigInt(entry.intentData.reward.nativeValue || 0), 18)} ETH</span>
                        </div>
                      ) : (
                        <ul className="list-disc pl-5">
                          {entry.intentData.reward.tokens.map((token, tokenIndex) => (
                            <li key={`reward-${tokenIndex}`} className="text-sm">
                              {formatUnits(token.amount, 6)} {findTokenByAddress(Number(intent.route.source) as RoutesSupportedChainId, token.token)?.id}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div className="mb-2">
                      <div className="font-medium">Destination Chain Tokens (Determined):</div>
                      {isNativeIntent ? (
                        <div className="ml-4">
                          <span>Native Value: {formatUnits(BigInt(entry.intentData.reward.nativeValue || 0), 18)} ETH</span>
                        </div>
                      ) : (
                        <ul className="list-disc pl-5">
                          {entry.intentData.route.tokens.map((token, tokenIndex) => (
                            <li key={`route-${tokenIndex}`} className="text-sm">
                              {formatUnits(BigInt(token.amount), 6)} {findTokenByAddress(Number(intent.route.destination) as RoutesSupportedChainId, token.token)?.id}
                            </li>
                          ))}
                        </ul>)}
                    </div>
                  )}

                  <div>
                    <span className="font-bold">Expires:</span> {new Date(Number(entry.expiryTime) * 1000).toLocaleString()}
                  </div>
                </div>
              ))}
              <button
                onClick={() => onQuoteSelected(quote)}
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4"
              >
                Select This Quote
              </button>
            </div>
          ))}
        </div>
        <div className="h-full">
          <pre className="h-full p-4 bg-gray-50 rounded-md overflow-auto text-xs">
            {
              `const quotes = await openQuotingClient.${quoteType === 'receive' ? 'requestQuotesForIntent' : 'requestReverseQuotesForIntent'}(intent);

                // Select the cheapest quote
                const selectedQuote = ${isNativeIntent ? 'selectCheapestQuoteNativeSend' : 'selectCheapestQuote'}(quotes);

                console.log(quotes);
                ${JSON.stringify(replaceBigIntsWithStrings(quotes), null, 2)}
`}
          </pre>
        </div>
      </div>
    </div>
  )
}