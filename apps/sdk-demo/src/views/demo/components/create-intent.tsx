import { useEffect, useMemo, useState, useRef } from "react";
import { RoutesSupportedChainId, RoutesService, CreateSimpleIntentParams, CreateNativeSendIntentParams } from "@eco-foundation/routes-sdk"
import { erc20Abi, formatUnits, Hex, isAddress } from "viem";
import { useAccount, useReadContract, useBalance } from "wagmi";
import { IntentType } from "@eco-foundation/routes-ts";
import { getAvailableStables } from "../../../utils";
import { chains } from "../../../wagmi";

type Props = {
  routesService: RoutesService,
  onNewIntent: (intent: IntentType, isNative: boolean) => void,
  quoteType: "receive" | "spend",
  setQuoteType: (type: "receive" | "spend") => void
  onIntentCleared?: () => void
}

export default function CreateIntent({
  routesService,
  onNewIntent,
  quoteType,
  setQuoteType,
  onIntentCleared
}: Props) {
  const { address } = useAccount();

  const [originChain, setOriginChain] = useState<RoutesSupportedChainId | undefined>();
  const [originChainInput, setOriginChainInput] = useState<string>("");
  const [originToken, setOriginToken] = useState<string | undefined>();
  const [destinationChain, setDestinationChain] = useState<RoutesSupportedChainId | undefined>();
  const [destinationChainInput, setDestinationChainInput] = useState<string>("");
  const [destinationToken, setDestinationToken] = useState<string | undefined>();
  const [amount, setAmount] = useState<number | string | undefined>();
  const [recipient, setRecipient] = useState<string | undefined>();
  const [prover, setProver] = useState<"HyperProver" | "MetaProver">("HyperProver");
  const [isNativeIntent, setIsNativeIntent] = useState<boolean>(false);

  const [isIntentValid, setIsIntentValid] = useState<boolean>(false);

  const originSelectRef = useRef<HTMLSelectElement>(null);
  const destinationSelectRef = useRef<HTMLSelectElement>(null);

  const supportedChainIds = routesService.supportedChainIds;

  const isOriginChainValid = originChainInput && supportedChainIds.includes(Number(originChainInput) as RoutesSupportedChainId);
  const isDestinationChainValid = destinationChainInput && supportedChainIds.includes(Number(destinationChainInput) as RoutesSupportedChainId);

  const effectiveOriginChain = isOriginChainValid ? Number(originChainInput) as RoutesSupportedChainId : originChain;
  const effectiveDestinationChain = isDestinationChainValid ? Number(destinationChainInput) as RoutesSupportedChainId : destinationChain;

  const { data: balance } = useReadContract({
    chainId: effectiveOriginChain,
    abi: erc20Abi,
    address: originToken as Hex | undefined,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: Boolean(originChain && originToken && address && !isNativeIntent) }
  })

  const { data: nativeBalance } = useBalance({
    chainId: effectiveOriginChain,
    address: address,
    query: { enabled: Boolean(effectiveOriginChain && address && isNativeIntent) }
  })

  const { data: decimals } = useReadContract({
    chainId: effectiveOriginChain,
    abi: erc20Abi,
    address: originToken as Hex | undefined,
    functionName: 'decimals',
    query: { enabled: Boolean(effectiveOriginChain && originToken) }
  })

  useEffect(() => {
    if (isNativeIntent) {
      // Native intent validation
      if (nativeBalance && address && effectiveOriginChain && effectiveDestinationChain && amount && recipient &&
        isAddress(recipient, { strict: false }) &&
        !isNaN(Number(amount)) &&
        Number(amount) > 0
      ) {
        try {
          const intent = routesService.createNativeSendIntent({
            creator: address,
            originChainID: effectiveOriginChain,
            destinationChainID: effectiveDestinationChain,
            amount: BigInt(amount),
            limit: nativeBalance.value,
            recipient,
            prover
          })

          setIsIntentValid(true)
          onNewIntent(intent, true)
        }
        catch (error) {
          console.error(error)
        }
      }
    } else {
      // Regular intent validation
      if (balance && address && effectiveOriginChain && originToken && effectiveDestinationChain && destinationToken && amount && recipient && prover &&
        isAddress(originToken, { strict: false }) &&
        isAddress(destinationToken, { strict: false }) &&
        isAddress(recipient, { strict: false }) &&
        !isNaN(Number(amount)) &&
        Number(amount) > 0
      ) {
        try {
          const intent = routesService.createSimpleIntent({
            creator: address,
            originChainID: effectiveOriginChain,
            spendingToken: originToken,
            spendingTokenLimit: quoteType === "receive" ? balance : BigInt(amount),
            destinationChainID: effectiveDestinationChain,
            receivingToken: destinationToken,
            amount: BigInt(amount),
            recipient,
            prover
          })

          setIsIntentValid(true)
          // set intent
          onNewIntent(intent, false)
        }
        catch (error) {
          console.error(error)
        }
      }
    }
    return () => {
      setIsIntentValid(false)
      onIntentCleared?.()
    }
  }, [isNativeIntent, balance, nativeBalance, address, effectiveOriginChain, originToken, effectiveDestinationChain, destinationToken, amount, recipient, prover, onNewIntent, onIntentCleared, routesService, quoteType]);

  const originTokensAvailable = useMemo(() => effectiveOriginChain ? getAvailableStables(effectiveOriginChain) : [], [effectiveOriginChain]);
  const destinationTokensAvailable = useMemo(() => effectiveDestinationChain ? getAvailableStables(effectiveDestinationChain) : [], [effectiveDestinationChain]);

  return (
    <div className="m-4">
      <span className='text-2xl'>Create Intent:</span>
      <div className="mb-4 p-2 border-1">
        <label className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            Native token intent:
          </span>
          <input
            type="checkbox"
            checked={isNativeIntent}
            onChange={(e) => {
              setIsNativeIntent(e.target.checked)
              // Reset form when switching intent types
              setOriginToken(undefined)
              setDestinationToken(undefined)
              setAmount(undefined)
            }}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 p-1 border-1">
            <span className="text-xl">Origin</span>
            <div className="flex flex-col gap-1">
              <span>Chain:</span>
              <div className="flex gap-2 items-center">
                <select ref={originSelectRef} onChange={(e) => {
                  const chainId = e.target.value;
                  setOriginChainInput(chainId);
                  const parsedChainId = parseInt(chainId) as RoutesSupportedChainId;
                  if (originToken && effectiveOriginChain) {
                    const originTokenConfig = getAvailableStables(effectiveOriginChain).find((token) => token.address === originToken)

                    const existingToken = getAvailableStables(parsedChainId).find((token) => token.id === originTokenConfig?.id)
                    if (existingToken) {
                      setOriginToken(existingToken.address)
                    }
                    else {
                      setOriginToken(undefined)
                    }
                  }
                  setOriginChain(parsedChainId)
                }}>
                  <option selected disabled>Select chain:</option>
                  {chains.map((chain) => (
                    <option key={chain.id} value={chain.id} disabled={effectiveDestinationChain && effectiveDestinationChain === Number(chain.id) as RoutesSupportedChainId}>{chain.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Chain ID"
                  className={`border-1 w-24 ${isOriginChainValid ? 'border-green-500' : originChainInput ? 'border-red-500' : ''}`}
                  value={originChainInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setOriginChainInput(value);

                    // Check if the entered value exists in the dropdown
                    const chainExists = chains.some(chain => chain.id.toString() === value);
                    if (originSelectRef.current) {
                      if (chainExists) {
                        originSelectRef.current.value = value;
                        const parsedChainId = parseInt(value) as RoutesSupportedChainId;
                        setOriginChain(parsedChainId);
                      } else {
                        originSelectRef.current.value = "";
                        setOriginChain(undefined);
                      }
                    }
                  }}
                />
              </div>
              {originChainInput && !isOriginChainValid && (
                <span className="text-red-500 text-sm">Invalid chain ID. Supported: {supportedChainIds.join(', ')}</span>
              )}
            </div>
            {!isNativeIntent && (
              <>
                <div>
                  <div className="flex gap-1">
                    <span>Token:</span>
                    <input type="text" className="border-1 w-full" value={originToken} onChange={(e) => setOriginToken(e.target.value)} />
                  </div>
                  {decimals && balance !== undefined ? <span className="text-sm italic">Balance: {formatUnits(balance, decimals)} (decimals: {decimals})</span> : null}
                </div>
                <div className="flex gap-2">
                  Stables available: {originTokensAvailable.map((tokenConfig) => (
                    <a key={tokenConfig.id} onClick={() => setOriginToken(tokenConfig.address)}>{tokenConfig.id}</a>
                  ))}
                </div>
              </>
            )}
            {isNativeIntent && nativeBalance && (
              <div>
                <span className="text-sm italic">Native Balance: {formatUnits(nativeBalance.value, 18)} {nativeBalance.symbol}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 p-1 border-1">
            <span className="text-xl">Destination</span>
            <div className="flex flex-col gap-1">
              <span>Chain:</span>
              <div className="flex gap-2 items-center">
                <select ref={destinationSelectRef} onChange={(e) => {
                  const chainId = e.target.value;
                  setDestinationChainInput(chainId);
                  const parsedChainId = parseInt(chainId) as RoutesSupportedChainId;
                  if (destinationToken && effectiveDestinationChain) {
                    const destinationTokenConfig = getAvailableStables(effectiveDestinationChain).find((token) => token.address === destinationToken)
                    const existingToken = getAvailableStables(parsedChainId).find((token) => token.id === destinationTokenConfig?.id)
                    if (existingToken) {
                      setDestinationToken(existingToken.address)
                    }
                    else {
                      setDestinationToken(undefined)
                    }
                  }
                  setDestinationChain(parsedChainId)
                }}>
                  <option selected disabled>Select chain:</option>
                  {chains.map((chain) => (
                    <option key={chain.id} value={chain.id} disabled={effectiveOriginChain && effectiveOriginChain === Number(chain.id) as RoutesSupportedChainId}>{chain.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Chain ID"
                  className={`border-1 w-24 ${isDestinationChainValid ? 'border-green-500' : destinationChainInput ? 'border-red-500' : ''}`}
                  value={destinationChainInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDestinationChainInput(value);

                    // Check if the entered value exists in the dropdown
                    const chainExists = chains.some(chain => chain.id.toString() === value);
                    if (destinationSelectRef.current) {
                      if (chainExists) {
                        destinationSelectRef.current.value = value;
                        const parsedChainId = parseInt(value) as RoutesSupportedChainId;
                        setDestinationChain(parsedChainId);
                      } else {
                        destinationSelectRef.current.value = "";
                        setDestinationChain(undefined);
                      }
                    }
                  }}
                />
              </div>
              {destinationChainInput && !isDestinationChainValid && (
                <span className="text-red-500 text-sm">Invalid chain ID. Supported: {supportedChainIds.join(', ')}</span>
              )}
            </div>
            {!isNativeIntent && (
              <>
                <div className="flex gap-1">
                  <span>Token:</span>
                  <input type="text" className="border-1 w-full" value={destinationToken} onChange={(e) => setDestinationToken(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  Stables available: {destinationTokensAvailable.map((tokenConfig) => (
                    <a key={tokenConfig.id} onClick={() => setDestinationToken(tokenConfig.address)}>{tokenConfig.id}</a>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col gap-1 p-1 border-1">
            <span className="text-xl">Amount {isNativeIntent ? '(in wei)' : ''}</span>
            <input type="number" className="border-1" value={amount} onChange={(e) => setAmount(e.target.value)} />
            {amount && isNativeIntent && <span className="text-sm italic">({formatUnits(BigInt(amount), 18)} {nativeBalance?.symbol || 'ETH'})</span>}
            {amount && !isNativeIntent && decimals && <span className="text-sm italic">({formatUnits(BigInt(amount), decimals)})</span>}
            <div className="flex gap-2 mb-2">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="quoteType"
                  value="receive"
                  checked={quoteType === "receive"}
                  onChange={() => setQuoteType("receive")}
                />
                <span>Receive this amount</span>
              </label>
              |
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="quoteType"
                  value="spend"
                  checked={quoteType === "spend"}
                  onChange={() => setQuoteType("spend")}
                />
                <span>Spend this amount</span>
              </label>
            </div>
          </div >

          <div className="flex flex-col gap-1 p-1 border-1">
            <span className="text-xl">Recipient</span>
            <input type="text" className="border-1" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            {address && <button onClick={() => setRecipient(address)}>Self</button>}
          </div>

          <div className="flex flex-col gap-1 p-1 border-1">
            <span className="text-xl">Prover</span>
            <select onChange={(e) => setProver(e.target.value as "HyperProver" | "MetaProver")}>
              <option value={"HyperProver"}>Hyper Prover</option>
              <option value={"MetaProver"}>Meta Prover</option>
            </select>
          </div>
        </div >
        <div className="h-full relative">
          <pre className="h-full">
            {isNativeIntent ?
              `const intent = routesService.createNativeSendIntent(${JSON.stringify({
                creator: address,
                originChainID: effectiveOriginChain,
                destinationChainID: effectiveDestinationChain,
                amount: amount ? Number(amount) : undefined,
                limit: nativeBalance?.value ? Number(nativeBalance.value) : undefined,
                recipient: recipient && recipient !== address ? recipient : undefined,
                prover
              } as Partial<CreateNativeSendIntentParams>, null, 2)})` :
              `const intent = routesService.createSimpleIntent(${JSON.stringify({
                creator: address,
                originChainID: effectiveOriginChain,
                spendingToken: originToken,
                spendingTokenLimit: balance ? Number(balance) : undefined,
                destinationChainID: effectiveDestinationChain,
                receivingToken: destinationToken,
                amount: amount ? Number(amount) : undefined,
                recipient: recipient && recipient !== address ? recipient : undefined,
                prover
              } as Partial<CreateSimpleIntentParams>, null, 2)})`
            }
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
      </div >
    </div >
  )
}