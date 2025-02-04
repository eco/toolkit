import { describe, test, expect, beforeAll, beforeEach } from "vitest";
import { createWalletClient, Hex, webSocket, PrivateKeyAccount, WalletClient, erc20Abi, createPublicClient } from "viem";
import { base, optimism } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { EcoProtocolAddresses, IntentSourceAbi, IntentType } from "@eco-foundation/routes-ts";

import { RoutesService, OpenQuotingClient, selectCheapestQuote, SimpleIntentActionData } from "../../src";

describe("publishIntent", () => {
  let account: PrivateKeyAccount
  let baseWalletClient: WalletClient
  let routesService: RoutesService
  let openQuotingClient: OpenQuotingClient
  let action: SimpleIntentActionData
  let intent: IntentType

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
    openQuotingClient = new OpenQuotingClient({ dAppID: "test" })
    account = privateKeyToAccount(process.env.VITE_TESTING_PK as Hex)
    baseWalletClient = createWalletClient({
      account,
      transport: webSocket(process.env.VITE_BASE_RPC_URL!)
    })
    action = {
      functionName: 'transfer',
      recipient: account.address
    }
  })

  beforeEach(() => {
    intent = routesService.createSimpleIntent({
      creator: account.address,
      originChainID: originChain.id,
      destinationChainID: destinationChain.id,
      receivingToken,
      spendingToken,
      amount,
      simpleIntentActionData: action,
    })
  })

  test("onchain with quote", async () => {
    // request quotes
    const quotes = await openQuotingClient.requestQuotesForIntent(intent)
    const selectedQuote = selectCheapestQuote(quotes)

    // setup the intent for publishing
    const quotedIntent = routesService.applyQuoteToIntent({
      intent,
      quote: selectedQuote
    })
    expect(quotedIntent).toBeDefined()

    // approve
    const approveTxHash = await baseWalletClient.writeContract({
      abi: erc20Abi,
      address: spendingToken,
      functionName: 'approve',
      args: [selectedQuote.intentSourceContract, amount],
      chain: originChain,
      account: account
    })

    await publicClient.waitForTransactionReceipt({ hash: approveTxHash })

    // publish intent onchain
    const publishTxHash = await baseWalletClient.writeContract({
      abi: IntentSourceAbi,
      address: selectedQuote.intentSourceContract,
      functionName: 'publishIntent',
      args: [intent, true],
      chain: originChain,
      account
    })

    await publicClient.waitForTransactionReceipt({ hash: publishTxHash })
  }, 20_000)

  test("onchain without quote", async () => {
    const intentSourceContract = EcoProtocolAddresses[routesService.getEcoChainId(originChain.id)].IntentSource
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
      functionName: 'publishIntent',
      args: [intent, true],
      chain: originChain,
      account
    })

    await publicClient.waitForTransactionReceipt({ hash: publishTxHash })
  }, 15_000)
})