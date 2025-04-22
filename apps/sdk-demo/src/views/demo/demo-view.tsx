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
  const routesService = useMemo(() => new RoutesService(config.preprodContracts ? { isPreprod: config.preprodContracts } : undefined), [config.preprodContracts])

  const [intent, setIntent] = useState<IntentType>();
  const [quotes, setQuotes] = useState<SolverQuote[]>();
  const [selectedQuote, setSelectedQuote] = useState<SolverQuote | undefined>();
  const [quoteType, setQuoteType] = useState<"receive" | "spend">("receive");

  useEffect(() => {
    if (intent) {
      const fetchQuotes = async () => {
        try {
          let quotesResult: SolverQuote[];
          if (quoteType === "receive") {
            quotesResult = await openQuotingClient.requestQuotesForIntent({ intent });
          } else {
            quotesResult = await openQuotingClient.requestReverseQuotesForIntent({ intent });
          }
          setQuotes(quotesResult);
        } catch (error) {
          alert('Could not fetch quotes: ' + (error as Error).message);
          console.error(error);
        }
      };

      fetchQuotes();
    }

    return () => {
      setSelectedQuote(undefined);
      setQuotes(undefined);
    }
  }, [intent, quoteType, openQuotingClient]);

  return (
    <div>
      <EditConfig />
      <CreateIntent routesService={routesService} onNewIntent={setIntent} quoteType={quoteType} setQuoteType={setQuoteType} />
      <SelectQuote intent={intent} quotes={quotes} onQuoteSelected={setSelectedQuote} quoteType={quoteType} />
      <PublishIntent routesService={routesService} quotes={quotes} quote={selectedQuote} openQuotingClient={openQuotingClient} />
    </div>
  );
}