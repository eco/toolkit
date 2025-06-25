import { describe, test, expect, beforeAll } from "vitest";
import { createWalletClient, Hex, webSocket, WalletClient, erc20Abi, createPublicClient, parseEventLogs } from "viem";
import { base, optimism } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { IntentSourceAbi } from "@eco-foundation/routes-ts";

import { RoutesService } from "../../src/index.js";

const account = privateKeyToAccount(process.env.VITE_TESTING_PK as Hex)

describe("refund", () => {
  let baseWalletClient: WalletClient
  let routesService: RoutesService

  const publicClient = createPublicClient({
    chain: base,
    transport: webSocket(process.env.VITE_BASE_RPC_URL!)
  })

  const amount = BigInt(10000) // 1 cent
  const originChain = base
  const destinationChain = optimism
  const receivingToken = RoutesService.getStableAddress(destinationChain.id, "USDC")
  const spendingToken = RoutesService.getStableAddress(originChain.id, "USDC")

  beforeAll(() => {
    routesService = new RoutesService()

    baseWalletClient = createWalletClient({
      account,
      transport: webSocket(process.env.VITE_BASE_RPC_URL!)
    })
  })

  test("refund simple intent", async () => {
    const intent = routesService.createSimpleIntent({
      creator: account.address,
      originChainID: originChain.id,
      destinationChainID: destinationChain.id,
      receivingToken,
      spendingToken,
      spendingTokenLimit: amount,
      amount,
      recipient: account.address,
      expiryTime: new Date(Date.now() + 1000 * 90) // 90 seconds from now
    })

    const intentSourceContract = routesService.getProtocolContractAddress(originChain.id, "IntentSource")
    expect(intentSourceContract).toBeDefined()

    // approve
    const approveTxHash = await baseWalletClient.writeContract({
      abi: erc20Abi,
      address: spendingToken,
      functionName: 'approve',
      args: [intentSourceContract, amount],
      chain: originChain,
      account: account
    })

    await publicClient.waitForTransactionReceipt({ hash: approveTxHash })

    // publish intent onchain
    const publishTxHash = await baseWalletClient.writeContract({
      abi: IntentSourceAbi,
      address: intentSourceContract,
      functionName: 'publishAndFund',
      args: [intent, false],
      chain: originChain,
      account
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash: publishTxHash })
    // decode logs and get the IntentCreated event
    const logs = parseEventLogs({
      abi: IntentSourceAbi,
      logs: receipt.logs
    })

    const intentCreatedEvent = logs.find((log) => log.eventName === 'IntentCreated')
    expect(intentCreatedEvent).toBeDefined()

    const parsedIntent = RoutesService.parseIntentFromIntentCreatedEventArgs(intentCreatedEvent!.args)

    // wait 90 seconds then refund
    await new Promise(resolve => setTimeout(resolve, 90_000))

    const refundTxHash = await baseWalletClient.writeContract({
      abi: IntentSourceAbi,
      address: intentSourceContract,
      functionName: 'refund',
      args: [parsedIntent],
      chain: originChain,
      account
    })

    await publicClient.waitForTransactionReceipt({ hash: refundTxHash })
  }, 120_000)
})
