'use client'

import { useEffect, useState } from "react";
import { RoutesService, SolverQuote, OpenQuotingClient } from "@eco-foundation/routes-sdk"
import { IntentType } from "@eco-foundation/routes-ts";
import CreateIntent from "./components/create-intent";
import SelectQuote from "./components/select-quote";

const routesService = new RoutesService({ isPreprod: true })
const openQuotingClient = new OpenQuotingClient({ dAppID: "sdk-demo", customBaseUrl: "https://quotes-preprod.eco.com" })

export default function DemoView() {
  const [intent, setIntent] = useState<IntentType>();
  const [quotes, setQuotes] = useState<SolverQuote[]>();
  const [selectedQuote, setSelectedQuote] = useState<SolverQuote | undefined>();

  useEffect(() => {
    if (intent) {
      openQuotingClient.requestQuotesForIntent(intent).then((quotes) => {
        setQuotes(quotes)
      }).catch((error) => {
        console.error(error)
      })
    }
    return () => {
      setSelectedQuote(undefined)
      setQuotes(undefined)
    }
  }, [intent]);

  return (
    <div>
      <CreateIntent onNewIntent={setIntent} />

      <SelectQuote intent={intent} quotes={quotes} onQuoteSelected={setSelectedQuote} />

      {intent && selectedQuote && (
        <button onClick={() => console.log(routesService.applyQuoteToIntent({ intent, quote: selectedQuote }))}>Publish Quoted Intent</button>
      )}
    </div>
  );
}