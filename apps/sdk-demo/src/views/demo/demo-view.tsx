'use client'

import { useEffect, useMemo, useState } from "react";
import { RoutesSupportedChainId, RoutesSupportedToken, RoutesService, SolverQuote, OpenQuotingClient } from "@eco-foundation/routes-sdk"
import { formatUnits, isAddress } from "viem";
import { useAccount } from "wagmi";
import { IntentType } from "@eco-foundation/routes-ts";

function getAvailableTokens(chain: RoutesSupportedChainId): MyTokenConfig[] {
  return Object.keys(RoutesSupportedToken).filter((token) => {
    try {
      RoutesService.getTokenAddress(chain, token as RoutesSupportedToken)
      return true
    }
    catch {
      return false
    }
  }).map((token) => ({
    id: token as RoutesSupportedToken,
    address: RoutesService.getTokenAddress(chain, token as RoutesSupportedToken)
  }))
}

function findTokenByAddress(chain: RoutesSupportedChainId, address: string): MyTokenConfig | undefined {
  return getAvailableTokens(chain).find((token) => token.address === address)
}

type MyChainConfig = {
  label: string,
  tokens: {
    id: RoutesSupportedToken,
    address: string
  }[]
}

type MyTokenConfig = {
  id: RoutesSupportedToken,
  address: string
}

const chains: Record<RoutesSupportedChainId, MyChainConfig> = {
  [RoutesSupportedChainId.Optimism]: {
    label: "Optimism",
    tokens: getAvailableTokens(RoutesSupportedChainId.Optimism)
  },
  [RoutesSupportedChainId.Mantle]: {
    label: "Mantle",
    tokens: getAvailableTokens(RoutesSupportedChainId.Mantle)
  },
  [RoutesSupportedChainId.Base]: {
    label: "Base",
    tokens: getAvailableTokens(RoutesSupportedChainId.Base)
  },
  [RoutesSupportedChainId.Arbitrum]: {
    label: "Arbitrum",
    tokens: getAvailableTokens(RoutesSupportedChainId.Arbitrum)
  }
}

const routesService = new RoutesService({ isPreprod: true })
const openQuotingClient = new OpenQuotingClient({ dAppID: "sdk-demo", customBaseUrl: "https://quotes-preprod.eco.com" })

export default function DemoView() {
  const { address } = useAccount();

  const [originChain, setOriginChain] = useState<RoutesSupportedChainId | undefined>();
  const [originToken, setOriginToken] = useState<string | undefined>();
  const [destinationChain, setDestinationChain] = useState<RoutesSupportedChainId | undefined>();
  const [destinationToken, setDestinationToken] = useState<string | undefined>();
  const [amount, setAmount] = useState<number | string | undefined>();
  const [recipient, setRecipient] = useState<string | undefined>();
  const [prover, setProver] = useState<"HyperProver" | "StorageProver">("HyperProver");

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

  useEffect(() => {
    if (address && originChain && originToken && destinationChain && destinationToken && amount && recipient && prover &&
      isAddress(originToken, { strict: false }) &&
      isAddress(destinationToken, { strict: false }) &&
      isAddress(recipient, { strict: false }) &&
      !isNaN(Number(amount)) &&
      Number(amount) > 0
    ) {
      try {
        const intent = routesService.createSimpleIntent({
          creator: address,
          originChainID: originChain,
          spendingToken: originToken,
          destinationChainID: destinationChain,
          receivingToken: destinationToken,
          amount: BigInt(amount),
          simpleIntentActionData: {
            functionName: 'transfer',
            recipient: recipient
          },
          prover
        })

        // set intent
        setIntent(intent)
      }
      catch (error) {
        console.error(error)
      }
    }
  }, [address, originChain, originToken, destinationChain, destinationToken, amount, recipient, prover]);

  const originTokensAvailable = useMemo(() => originChain ? getAvailableTokens(originChain) : [], [originChain]);
  const destinationTokensAvailable = useMemo(() => destinationChain ? getAvailableTokens(destinationChain) : [], [destinationChain]);

  return (
    <div>
      <div className="m-4 ">
        <span className='text-2xl'>Select Route:</span>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 p-1 border-1">
            <span className="text-xl">Origin</span>
            <div className="flex">
              <span>Chain:</span>
              <select onChange={(e) => {
                const chainId = parseInt(e.target.value) as RoutesSupportedChainId
                if (originToken && originChain) {
                  const originTokenConfig = getAvailableTokens(originChain).find((token) => token.address === originToken)

                  const existingToken = getAvailableTokens(chainId).find((token) => token.id === originTokenConfig?.id)
                  if (existingToken) {
                    setOriginToken(existingToken.address)
                  }
                  else {
                    setOriginToken(undefined)
                  }
                }
                setOriginChain(chainId)
              }}>
                <option selected disabled>Select chain:</option>
                {Object.entries(chains).map(([chainId, chainConfig]) => (
                  <option key={chainId} value={chainId} disabled={destinationChain && destinationChain === Number(chainId) as RoutesSupportedChainId}>{chainConfig.label}</option>
                ))}
              </select>
            </div>
            <div className="flex">
              <span>Token:</span>
              <input type="text" className="border-1" value={originToken} onChange={(e) => setOriginToken(e.target.value)} />
            </div>
            <div className="flex gap-2">
              {originTokensAvailable.map((tokenConfig) => (
                <a key={tokenConfig.id} onClick={() => setOriginToken(tokenConfig.address)}>{tokenConfig.id}</a>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 p-1 border-1">
            <span className="text-xl">Destination</span>
            <div className="flex">
              <span>Chain:</span>
              <select onChange={(e) => {
                const chainId = parseInt(e.target.value) as RoutesSupportedChainId
                if (destinationToken && destinationChain) {
                  const destinationTokenConfig = getAvailableTokens(destinationChain).find((token) => token.address === destinationToken)

                  const existingToken = getAvailableTokens(chainId).find((token) => token.id === destinationTokenConfig?.id)
                  if (existingToken) {
                    setDestinationToken(existingToken.address)
                  }
                  else {
                    setDestinationToken(undefined)
                  }
                }
                setDestinationChain(chainId)
              }}>
                <option selected disabled>Select chain:</option>
                {Object.entries(chains).map(([chainId, chainConfig]) => (
                  <option key={chainId} value={chainId} disabled={originChain && originChain === Number(chainId) as RoutesSupportedChainId}>{chainConfig.label}</option>
                ))}
              </select>
            </div>
            <div className="flex">
              <span>Token:</span>
              <input type="text" className="border-1" value={destinationToken} onChange={(e) => setDestinationToken(e.target.value)} />
            </div>
            <div className="flex gap-2">
              {destinationTokensAvailable.map((tokenConfig) => (
                <a key={tokenConfig.id} onClick={() => setDestinationToken(tokenConfig.address)}>{tokenConfig.id}</a>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 p-1 border-1">
            <span className="text-xl">Amount</span>
            <input type="number" className="border-1" value={amount} onChange={(e) => setAmount(e.target.value)} />
            {amount && <span>({formatUnits(BigInt(amount), 6)} USD)</span>}
          </div>

          <div className="flex flex-col gap-1 p-1 border-1">
            <span className="text-xl">Recipient</span>
            <input type="text" className="border-1" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            {address && <button onClick={() => setRecipient(address)}>Self</button>}
          </div>

          <div className="flex flex-col gap-1 p-1 border-1">
            <span className="text-xl">Prover</span>
            <select onChange={(e) => setProver(e.target.value as "HyperProver" | "StorageProver")}>
              <option value={"HyperProver"}>Hyper Prover</option>
              <option value={"StorageProver"}>Storage Prover</option>
            </select>
          </div>
        </div>
      </div>

      {intent && quotes && (
        <div className="m-4">
          <span className="text-2xl">Quotes Available:</span>
          <div className="flex flex-col gap-2">
            {intent && quotes && quotes.map((quote) => (
              <div key={quote.receiveSignedIntentUrl} className="p-2 border-1 flex flex-col">
                <span>Quote from {quote.receiveSignedIntentUrl}</span>
                <span>IntentSource Contract: {quote.intentSourceContract}</span>
                <span>Amounts requested:</span>
                <ul className="list-disc">
                  {quote.quoteData.tokens.map((token) => (
                    <li className="ml-4">{formatUnits(BigInt(token.amount), 6)} {findTokenByAddress(originChain!, token.token)?.id}</li>
                  ))}
                </ul>

                <span>Quote expires at: {new Date(Number(quote.quoteData.expiryTime) * 1000).toISOString()}</span>
                <button onClick={() => setSelectedQuote(quote)}>Select Quote</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {intent && selectedQuote && (
        <button onClick={console.log}>Publish Quoted Intent</button>
      )}
    </div>
  );
}