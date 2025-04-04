import { describe, test, expect, beforeAll } from "vitest";
import { createWalletClient, Hex, webSocket, WalletClient, erc20Abi, createPublicClient } from "viem";
import { base, optimism } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { EcoProtocolAddresses, IntentSourceAbi } from "@eco-foundation/routes-ts";

import { RoutesService, OpenQuotingClient, selectCheapestQuote } from "../../src";

const account = privateKeyToAccount(process.env.VITE_TESTING_PK as Hex)

describe("publishAndFund", () => {
  let baseWalletClient: WalletClient
  let routesService: RoutesService
  let openQuotingClient: OpenQuotingClient

  const publicClient = createPublicClient({
    chain: base,
    transport: webSocket(process.env.VITE_BASE_RPC_URL!)
  })

  const amount = BigInt(10000) // 1 cent
  const balance = BigInt(1000000000) // 1000 USDC
  const originChain = base
  const destinationChain = optimism
  const receivingToken = RoutesService.getStableAddress(destinationChain.id, "USDC")
  const spendingToken = RoutesService.getStableAddress(originChain.id, "USDC")

  beforeAll(() => {
    routesService = new RoutesService()
    openQuotingClient = new OpenQuotingClient({ dAppID: "test" })

    baseWalletClient = createWalletClient({
      account,
      transport: webSocket(process.env.VITE_BASE_RPC_URL!)
    })
  })

  test("onchain with quote", async () => {
    const intentSourceContract = EcoProtocolAddresses[routesService.getEcoChainId(originChain.id)].IntentSource

    const intent = routesService.createSimpleIntent({
      creator: account.address,
      originChainID: originChain.id,
      destinationChainID: destinationChain.id,
      receivingToken,
      spendingToken,
      spendingTokenLimit: balance,
      amount,
      recipient: account.address
    })

    // request quotes
    const quotes = await openQuotingClient.requestQuotesForIntent({ intent })
    const { quoteData } = selectCheapestQuote(quotes, false, ["SELF_PUBLISH"])

    // approve
    await Promise.all(quoteData.intentData.reward.tokens.map(async ({ token, amount }) => {
      const hash = await baseWalletClient.writeContract({
        abi: erc20Abi,
        address: token,
        functionName: 'approve',
        args: [intentSourceContract, amount],
        chain: originChain,
        account
      })
      await publicClient.waitForTransactionReceipt({ hash })
    }))

    // publish intent onchain
    const publishTxHash = await baseWalletClient.writeContract({
      abi: IntentSourceAbi,
      address: intentSourceContract,
      functionName: 'publishAndFund',
      args: [quoteData.intentData, false],
      chain: originChain,
      account
    })

    await publicClient.waitForTransactionReceipt({ hash: publishTxHash })
  }, 20_000)

  test("onchain without quote", async () => {
    const intent = routesService.createSimpleIntent({
      creator: account.address,
      originChainID: originChain.id,
      destinationChainID: destinationChain.id,
      receivingToken,
      spendingToken,
      spendingTokenLimit: amount,
      amount,
      recipient: account.address
    })

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
      functionName: 'publishAndFund',
      args: [intent, false],
      chain: originChain,
      account
    })

    await publicClient.waitForTransactionReceipt({ hash: publishTxHash })
  }, 15_000)
})