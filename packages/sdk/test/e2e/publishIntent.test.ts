import { describe, test, expect, beforeAll } from "vitest";
import { createWalletClient, Hex, webSocket, PrivateKeyAccount, WalletClient, encodeFunctionData, erc20Abi } from "viem";
import { base, optimism } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { IntentSourceAbi } from "@eco-foundation/routes"

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

    // get quotes for the intent data and select a quote
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

    // approve
    await baseWalletClient.writeContract({
      abi: erc20Abi,
      address: spendingToken,
      functionName: 'approve',
      args: [selectedQuote.intentSourceContract, amount],
      chain: base,
      account: account
    })

    // publish intent onchain
    await baseWalletClient.writeContract({
      abi: IntentSourceAbi,
      address: selectedQuote.intentSourceContract,
      functionName: 'publishIntent',
      args: [intent, true],
      chain: base,
      account
    })
  })
})