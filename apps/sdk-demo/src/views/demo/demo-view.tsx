'use client'

import { useEffect, useMemo, useState } from "react";
import { SolverQuote, OpenQuotingClient, RoutesService } from "@eco-foundation/routes-sdk"
import { IntentType } from "@eco-foundation/routes-ts";
import CreateIntent from "./components/create-intent";
import SelectQuote from "./components/select-quote";
import PublishIntent from "./components/publish-intent";
import EditConfig from "../../components/edit-config";
import { useConfig } from "../../providers/config-provider";

export default function DemoView() {
  const config = useConfig();
  const openQuotingClient = useMemo(() => new OpenQuotingClient({ dAppID: "sdk-demo", customBaseUrl: config.openQuotingClientUrl }), [config.openQuotingClientUrl])
  const routesService = useMemo(() => new RoutesService({ isPreprod: config.preprodContracts }), [config.preprodContracts])

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
  }, [intent, openQuotingClient]);

  return (
    <div>
      <EditConfig />
      <CreateIntent routesService={routesService} onNewIntent={setIntent} />
      <SelectQuote intent={intent} quotes={quotes} onQuoteSelected={setSelectedQuote} />
      <PublishIntent routesService={routesService} intent={intent} quotes={quotes} quote={selectedQuote} />
    </div>
  );
}