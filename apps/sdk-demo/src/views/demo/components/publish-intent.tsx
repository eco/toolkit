import { RoutesService, RoutesSupportedChainId, SolverQuote } from "@eco-foundation/routes-sdk"
import { IntentType, IntentSourceAbi, InboxAbi } from "@eco-foundation/routes-ts"
import { useCallback, useState } from "react"
import { useChains, useWriteContract } from "wagmi"
import { waitForTransactionReceipt, watchContractEvent } from "@wagmi/core"
import { erc20Abi, Hex, parseEventLogs } from "viem"
import { config } from "../../../wagmi"

const routesService = new RoutesService({ isPreprod: true })

type Props = {
  intent: IntentType | undefined,
  quote: SolverQuote | undefined
}

export default function PublishIntent({ intent, quote }: Props) {
  const chains = useChains()
  const { writeContractAsync } = useWriteContract()
  const [isPublishing, setIsPublishing] = useState<boolean>(false)

  const [approvalTxHashes, setApprovalTxHashes] = useState<Hex[]>([])
  const [publishTxHash, setPublishTxHash] = useState<Hex | undefined>()
  const [fulfillmentTxHash, setFulfillmentTxHash] = useState<Hex | undefined>()

  const publishIntent = useCallback(async () => {
    if (!intent || !quote) return
    try {
      const quotedIntent = routesService.applyQuoteToIntent({ intent, quote })

      setIsPublishing(true)

      // approve the amount for the intent source contract, then publish the intent

      const approveTxHashes = await Promise.all(quotedIntent.reward.tokens.map((rewardToken) => writeContractAsync({
        chainId: Number(intent.route.source),
        abi: erc20Abi,
        functionName: 'approve',
        address: rewardToken.token,
        args: [quote.intentSourceContract, rewardToken.amount]
      })))
      await Promise.all(approveTxHashes.map((txHash) => waitForTransactionReceipt(config, { hash: txHash })))

      setApprovalTxHashes(approveTxHashes)

      const publishTxHash = await writeContractAsync({
        chainId: Number(intent.route.source),
        abi: IntentSourceAbi,
        functionName: 'publishIntent',
        address: quote.intentSourceContract,
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
          chainId: Number(intent.route.destination) as RoutesSupportedChainId,
          abi: InboxAbi,
          eventName: 'Fulfillment',
          address: quotedIntent.route.inbox,
          args: {
            _hash: intentCreatedEvent.args.hash
          },
          onLogs(logs) {
            if (logs && logs.length > 0) {
              const fulfillmentTxHash = logs[0]!.transactionHash
              alert('Intent fulfilled: ' + fulfillmentTxHash)
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
    }
    catch (error: any) {
      alert('Could not publish intent: ' + error.message)
      console.error(error)
    }
    finally {
      setIsPublishing(false)
    }
  }, [intent, quote])

  if (!intent || !quote) return null

  return (
    <div>
      <button onClick={publishIntent}>Publish Quoted Intent</button>
      {isPublishing && (
        <div>
          <span>Publishing intent...</span>
          <span>Approval transactions:</span>
          <ul>
            {approvalTxHashes.map((txHash) => (
              <li className="ml-4" key={txHash}>{txHash}</li>
            ))}
          </ul>
          {publishTxHash && (
            <div>
              <span>Intent Published:</span>
              <span>{publishTxHash}</span>
            </div>
          )}
          {fulfillmentTxHash && (
            <div>
              <span>Intent fulfilled:</span>
              <span>{fulfillmentTxHash}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}