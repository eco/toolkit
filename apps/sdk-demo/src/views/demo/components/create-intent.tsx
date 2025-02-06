import { useEffect, useMemo, useState } from "react";
import { RoutesSupportedChainId, RoutesService, CreateSimpleIntentParams } from "@eco-foundation/routes-sdk"
import { formatUnits, Hex, isAddress } from "viem";
import { useAccount, useBalance } from "wagmi";
import { IntentType } from "@eco-foundation/routes-ts";
import { getAvailableStables } from "../../../utils";
import { chains } from "../../../config";

const routesService = new RoutesService({ isPreprod: true })

type Props = {
  onNewIntent: (intent: IntentType) => void
}

export default function CreateIntent({
  onNewIntent
}: Props) {
  const { address } = useAccount();

  const [originChain, setOriginChain] = useState<RoutesSupportedChainId | undefined>();
  const [originToken, setOriginToken] = useState<string | undefined>();
  const [destinationChain, setDestinationChain] = useState<RoutesSupportedChainId | undefined>();
  const [destinationToken, setDestinationToken] = useState<string | undefined>();
  const [amount, setAmount] = useState<number | string | undefined>();
  const [recipient, setRecipient] = useState<string | undefined>();
  const [prover, setProver] = useState<"HyperProver" | "StorageProver">("HyperProver");

  const [isIntentValid, setIsIntentValid] = useState<boolean>(false);

  const { data } = useBalance({
    chainId: originChain,
    address: originToken as Hex | undefined
  })

  useEffect(() => {
    if (data && address && originChain && originToken && destinationChain && destinationToken && amount && recipient && prover &&
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
          spendingTokenBalance: data.value,
          destinationChainID: destinationChain,
          receivingToken: destinationToken,
          amount: BigInt(amount),
          recipient,
          prover
        })

        setIsIntentValid(true)
        // set intent
        onNewIntent(intent)
      }
      catch (error) {
        console.error(error)
      }
    }
    return () => {
      setIsIntentValid(false)
    }
  }, [data, address, originChain, originToken, destinationChain, destinationToken, amount, recipient, prover, onNewIntent]);

  const originTokensAvailable = useMemo(() => originChain ? getAvailableStables(originChain) : [], [originChain]);
  const destinationTokensAvailable = useMemo(() => destinationChain ? getAvailableStables(destinationChain) : [], [destinationChain]);

  return (
    <div className="m-4">
      <span className='text-2xl'>Create Intent:</span>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 p-1 border-1">
            <span className="text-xl">Origin</span>
            <div className="flex gap-1">
              <span>Chain:</span>
              <select onChange={(e) => {
                const chainId = parseInt(e.target.value) as RoutesSupportedChainId
                if (originToken && originChain) {
                  const originTokenConfig = getAvailableStables(originChain).find((token) => token.address === originToken)

                  const existingToken = getAvailableStables(chainId).find((token) => token.id === originTokenConfig?.id)
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
            <div className="flex gap-1">
              <span>Token:</span>
              <input type="text" className="border-1 w-full" value={originToken} onChange={(e) => setOriginToken(e.target.value)} />
            </div>
            <div className="flex gap-2">
              Stables available: {originTokensAvailable.map((tokenConfig) => (
                <a key={tokenConfig.id} onClick={() => setOriginToken(tokenConfig.address)}>{tokenConfig.id}</a>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 p-1 border-1">
            <span className="text-xl">Destination</span>
            <div className="flex gap-1">
              <span>Chain:</span>
              <select onChange={(e) => {
                const chainId = parseInt(e.target.value) as RoutesSupportedChainId
                if (destinationToken && destinationChain) {
                  const destinationTokenConfig = getAvailableStables(destinationChain).find((token) => token.address === destinationToken)
                  const existingToken = getAvailableStables(chainId).find((token) => token.id === destinationTokenConfig?.id)
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
            <div className="flex gap-1">
              <span>Token:</span>
              <input type="text" className="border-1 w-full" value={destinationToken} onChange={(e) => setDestinationToken(e.target.value)} />
            </div>
            <div className="flex gap-2">
              Stables available: {destinationTokensAvailable.map((tokenConfig) => (
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
        <div className="h-full relative">
          <pre className="h-full">
            {`const intent = new RoutesService().createSimpleIntent(${JSON.stringify({
              creator: address,
              originChainID: originChain,
              spendingToken: originToken,
              spendingTokenBalance: data?.value,
              destinationChainID: destinationChain,
              receivingToken: destinationToken,
              amount,
              recipient: recipient && recipient !== address ? recipient : undefined,
              prover
            } as Partial<CreateSimpleIntentParams>, null, 2)})`}
          </pre>
          <div className="absolute bottom-0 right-0 p-4 flex items-center gap-1 font-semibold">
            {isIntentValid ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                </svg> Valid
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                </svg>
                Incomplete
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}