'use client'

import { useEffect, useState } from "react";
import { SolverQuote, OpenQuotingClient } from "@eco-foundation/routes-sdk"
import { IntentType } from "@eco-foundation/routes-ts";
import CreateIntent from "./components/create-intent";
import SelectQuote from "./components/select-quote";
import PublishIntent from "./components/publish-intent";
import EditConfig from "../../components/edit-config";

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
        alert('Could not fetch quotes: ' + error.message)
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
      <EditConfig />
      <CreateIntent onNewIntent={setIntent} />
      <SelectQuote intent={intent} quotes={quotes} onQuoteSelected={setSelectedQuote} />
      <PublishIntent intent={intent} quote={selectedQuote} />
    </div>
  );
}