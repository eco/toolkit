import { RoutesService, RoutesSupportedChainId, SolverQuote } from "@eco-foundation/routes-sdk"
import { IntentType, IntentSourceAbi, InboxAbi, EcoProtocolAddresses } from "@eco-foundation/routes-ts"
import { useCallback, useState } from "react"
import { useAccount, useSwitchChain, useWriteContract } from "wagmi"
import { waitForTransactionReceipt, watchContractEvent } from "@wagmi/core"
import { erc20Abi, Hex, parseEventLogs } from "viem"
import { config } from "../../../wagmi"
import { chains } from "../../../config"

type Props = {
  routesService: RoutesService,
  intent: IntentType | undefined,
  quotes: SolverQuote[] | undefined,
  quote: SolverQuote | undefined
}

export default function PublishIntent({ routesService, intent, quotes, quote }: Props) {
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const { writeContractAsync } = useWriteContract()
  const [isPublishing, setIsPublishing] = useState<boolean>(false)
  const [isPublished, setIsPublished] = useState<boolean>(false)

  const [approvalTxHashes, setApprovalTxHashes] = useState<Hex[]>([])
  const [publishTxHash, setPublishTxHash] = useState<Hex | undefined>()
  const [fulfillmentTxHash, setFulfillmentTxHash] = useState<Hex | undefined>()

  const publishIntent = useCallback(async () => {
    if (!intent || !quote) return
    try {
      const quotedIntent = routesService.applyQuoteToIntent({ intent, quote })

      console.log("Quoted Intent:", quotedIntent)

      setIsPublishing(true)

      const intentSourceContract = EcoProtocolAddresses[routesService.getEcoChainId(Number(quotedIntent.route.source) as RoutesSupportedChainId)].IntentSource

      // approve the amount for the intent source contract, then publish the intent

      const approveTxHashes = await Promise.all(quotedIntent.reward.tokens.map((rewardToken) => writeContractAsync({
        chainId: Number(quotedIntent.route.source),
        abi: erc20Abi,
        functionName: 'approve',
        address: rewardToken.token,
        args: [intentSourceContract, rewardToken.amount]
      })))
      await Promise.all(approveTxHashes.map((txHash) => waitForTransactionReceipt(config, { hash: txHash })))

      setApprovalTxHashes(approveTxHashes)

      const publishTxHash = await writeContractAsync({
        chainId: Number(quotedIntent.route.source),
        abi: IntentSourceAbi,
        functionName: 'publishIntent',
        address: intentSourceContract,
        args: [quotedIntent, true]
      })

      const receipt = await waitForTransactionReceipt(config, { hash: publishTxHash })
      const logs = parseEventLogs({
        abi: IntentSourceAbi,
        logs: receipt.logs
      })
      const intentCreatedEvent = logs.find((log) => log.eventName === 'IntentCreated')

      if (!intentCreatedEvent) {
        throw new Error('IntentCreated event not found in logs')
      }

      setPublishTxHash(publishTxHash)

      const fulfillmentTxHash = await new Promise<Hex>((resolve, reject) => {
        const unwatch = watchContractEvent(config, {
          fromBlock: receipt.blockNumber - BigInt(5),
          chainId: Number(quotedIntent.route.destination) as RoutesSupportedChainId,
          abi: InboxAbi,
          eventName: 'Fulfillment',
          address: quotedIntent.route.inbox,
          args: {
            _hash: intentCreatedEvent.args.hash
          },
          onLogs(logs) {
            if (logs && logs.length > 0) {
              const fulfillmentTxHash = logs[0]!.transactionHash
              unwatch()
              resolve(fulfillmentTxHash)
            }
          },
          onError(error) {
            unwatch()
            reject(error)
          }
        })
      })

      setFulfillmentTxHash(fulfillmentTxHash)
      setIsPublished(true)
    }
    catch (error) {
      alert('Could not publish intent: ' + (error as Error).message)
      console.error(error)
    }
    finally {
      setIsPublishing(false)
    }
  }, [intent, quote, writeContractAsync, routesService])

  if (!intent || !quote) return null

  return (
    <div className="m-4 flex flex-col">
      <span className="text-2xl">Publish Intent with Selected Quote:</span>
      <div className="grid grid-cols-2 gap-4">
        <div className="border-1 p-2 flex flex-col">
          {isPublishing || isPublished ? (
            <div className="flex flex-col gap-2">
              {isPublishing && <span>Publishing intent...</span>}
              {approvalTxHashes.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <span>Approval transactions:</span>
                  <ul className="list-disc">
                    {approvalTxHashes.map((txHash) => (
                      <li className="ml-6" key={txHash}>{txHash}</li>
                    ))}
                  </ul>
                </div>
              ) : <span>Approving..</span>}

              {publishTxHash ? (
                <div>
                  <span>Intent Published:</span>
                  <span>{publishTxHash}</span>
                </div>
              ) : <span>Publishing..</span>}
              {fulfillmentTxHash ? (
                <div>
                  <span>Intent fulfilled:</span>
                  <span>{fulfillmentTxHash}</span>
                </div>
              ) : <span>Waiting for fulfillment..</span>}

              {isPublished && (
                <div className="flex gap-4 align-center">
                  <span>Intent published and fulfilled!</span>
                  <button onClick={() => window.location.reload()}>Restart</button>
                </div>
              )}
            </div>
          ) : (<>
            {chainId !== Number(intent.route.source) ?
              <button onClick={() => switchChain({ chainId: Number(intent.route.source) })}>
                Switch to {chains[Number(intent.route.source) as RoutesSupportedChainId].label}
              </button> : (
                <button onClick={publishIntent}>Approve and Publish Quoted Intent</button>
              )}
          </>)}
        </div>
        <div>
          <pre>
            {`${quotes && quote ? `const selectedQuote = quotes[${quotes.indexOf(quote)}];
const quotedIntent = routesService.applyQuoteToIntent({ intent, quote: selectedQuote });
              ` : undefined}`}
          </pre>
        </div>
      </div>
    </div>
  )
}