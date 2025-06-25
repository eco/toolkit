'use client'

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const routesService = useMemo(() => new RoutesService({ isPreprod: config.preprodContracts, customProtocolAddresses: config.customProtocolAddresses }), [config.preprodContracts, config.customProtocolAddresses])

  const [intent, setIntent] = useState<IntentType>();
  const [quotes, setQuotes] = useState<SolverQuote[]>();
  const [selectedQuote, setSelectedQuote] = useState<SolverQuote | undefined>();
  const [quoteType, setQuoteType] = useState<"receive" | "spend">("receive");
  const [isNativeIntent, setIsNativeIntent] = useState<boolean>(false);

  const handleNewIntent = useCallback((newIntent: IntentType, isNative: boolean) => {
    setQuotes(undefined);
    setSelectedQuote(undefined);
    setIntent(newIntent);
    setIsNativeIntent(isNative);
  }, [setIntent, setIsNativeIntent]);

  const handleIntentCleared = useCallback(() => {
    setQuotes(undefined);
    setSelectedQuote(undefined);
    setIntent(undefined);
  }, [setQuotes, setSelectedQuote, setIntent]);

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
      <CreateIntent routesService={routesService} onNewIntent={handleNewIntent} quoteType={quoteType} setQuoteType={setQuoteType} onIntentCleared={handleIntentCleared} />
      <SelectQuote intent={intent} quotes={quotes} isNativeIntent={isNativeIntent} onQuoteSelected={setSelectedQuote} quoteType={quoteType} />
      <PublishIntent routesService={routesService} quotes={quotes} quote={selectedQuote} isNativeIntent={isNativeIntent} openQuotingClient={openQuotingClient} />
    </div>
  );
}