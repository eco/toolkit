import { describe, test, expect, beforeAll } from "vitest";
import { createWalletClient, Hex, webSocket, PrivateKeyAccount, WalletClient, encodeFunctionData, erc20Abi, createPublicClient } from "viem";
import { base, optimism } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { IntentSourceAbi } from "@eco-foundation/routes-ts";

import { RoutesService, OpenQuotingClient, IntentsService, selectCheapestQuote } from "../../src";

describe("publishIntent", () => {
  let account: PrivateKeyAccount
  let baseWalletClient: WalletClient
  let routesService: RoutesService
  let openQuotingClient: OpenQuotingClient
  let intentsService: IntentsService

  beforeAll(() => {
    routesService = new RoutesService()
    openQuotingClient = new OpenQuotingClient({ dAppID: "test" })
    intentsService = new IntentsService()
    account = privateKeyToAccount(process.env.VITE_TESTING_PK as Hex)
    baseWalletClient = createWalletClient({
      account,
      transport: webSocket(process.env.VITE_BASE_RPC_URL!)
    })
  })

  test("onchain", async () => {
    const amount = BigInt(10000) // 1 cent
    const recipient = account.address
    const originChain = base
    const destinationChain = optimism
    const receivingToken = RoutesService.getTokenAddress(destinationChain.id, "USDC")
    const spendingToken = RoutesService.getTokenAddress(originChain.id, "USDC")
    const action = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipient, amount]
    })

    // create valid intent data
    const intentData = routesService.createSimpleRoute({
      originChainID: originChain.id,
      destinationChainID: destinationChain.id,
      receivingToken,
      spendingToken,
      amount,
      simpleRouteActionData: action,
    })

    const quotes = await openQuotingClient.requestQuotesForIntent(intentData)
    const selectedQuote = selectCheapestQuote(quotes)

    // setup the intent for publishing
    const {
      intent,
    } = intentsService.setupIntentForPublishing({
      creator: account.address,
      intentData,
      quote: selectedQuote
    })
    expect(intent).toBeDefined()

    const publicClient = createPublicClient({
      chain: base,
      transport: webSocket(process.env.VITE_BASE_RPC_URL!)
    })

    // approve
    const approveTxHash = await baseWalletClient.writeContract({
      abi: erc20Abi,
      address: spendingToken,
      functionName: 'approve',
      args: [selectedQuote.intentSourceContract, amount],
      chain: base,
      account: account
    })

    await publicClient.waitForTransactionReceipt({ hash: approveTxHash })

    // publish intent onchain
    const publishTxHash = await baseWalletClient.writeContract({
      abi: IntentSourceAbi,
      address: selectedQuote.intentSourceContract,
      functionName: 'publishIntent',
      args: [intent, true],
      chain: base,
      account
    })

    await publicClient.waitForTransactionReceipt({ hash: publishTxHash })
  }, 15_000)
})