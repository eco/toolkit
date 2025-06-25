import { describe, test, expect, beforeAll } from "vitest";
import { createWalletClient, Hex, webSocket, WalletClient, erc20Abi, createPublicClient } from "viem";
import { base, optimism } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { IntentSourceAbi } from "@eco-foundation/routes-ts";

import { RoutesService, OpenQuotingClient, selectCheapestQuote, selectCheapestQuoteNativeSend } from "../../src/index.js";

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

  test("simple intent onchain with quote", async () => {
    const intentSourceContract = routesService.getProtocolContractAddress(originChain.id, "IntentSource")

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
    const { quote } = selectCheapestQuote(quotes)

    // approve
    await Promise.all(quote.intentData.reward.tokens.map(async ({ token, amount }) => {
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
      args: [quote.intentData, false],
      chain: originChain,
      account
    })

    await publicClient.waitForTransactionReceipt({ hash: publishTxHash })
  }, 20_000)

  test("onchain with reverse quote", async () => {
    const intentSourceContract = routesService.getProtocolContractAddress(originChain.id, 'IntentSource')

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
    const quotes = await openQuotingClient.requestReverseQuotesForIntent({ intent })
    const { quote } = selectCheapestQuote(quotes)

    // approve
    await Promise.all(quote.intentData.reward.tokens.map(async ({ token, amount }) => {
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
      args: [quote.intentData, false],
      chain: originChain,
      account
    })

    await publicClient.waitForTransactionReceipt({ hash: publishTxHash })
  }, 20_000);

  test("sinple intent onchain without quote", async () => {
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

    await publicClient.waitForTransactionReceipt({ hash: publishTxHash })
  }, 15_000)

  test("native send intent onchain without quote", async () => {
    const nativeAmount = BigInt("10000") // 0.00000000000001 ETH

    const intent = routesService.createNativeSendIntent({
      creator: account.address,
      originChainID: originChain.id,
      destinationChainID: destinationChain.id,
      amount: nativeAmount,
      limit: nativeAmount * BigInt(10),
      recipient: account.address
    })

    const intentSourceContract = routesService.getProtocolContractAddress(originChain.id, "IntentSource")
    expect(intentSourceContract).toBeDefined()
    expect(intent.reward.nativeValue).toBe(nativeAmount)

    // publish intent onchain with native value
    const publishTxHash = await baseWalletClient.writeContract({
      abi: IntentSourceAbi,
      address: intentSourceContract,
      functionName: 'publishAndFund',
      args: [intent, false],
      chain: originChain,
      account,
      value: intent.reward.nativeValue
    })

    await publicClient.waitForTransactionReceipt({ hash: publishTxHash })
  }, 15_000)

  test("native send intent onchain with quote", async () => {
    const intentSourceContract = routesService.getProtocolContractAddress(originChain.id, "IntentSource")
    const nativeAmount = BigInt("10000") // 0.00000000000001 ETH

    const intent = routesService.createNativeSendIntent({
      creator: account.address,
      originChainID: originChain.id,
      destinationChainID: destinationChain.id,
      amount: nativeAmount,
      limit: nativeAmount * BigInt(10),
      recipient: account.address
    })

    // request quotes
    const quotes = await openQuotingClient.requestQuotesForIntent({ intent })
    const { quote } = selectCheapestQuoteNativeSend(quotes)

    // setup the intent for publishing
    expect(quote.intentData).toBeDefined()
    expect(quote.intentData.reward.nativeValue).toBeGreaterThan(BigInt(0))

    // publish intent onchain with native value
    const publishTxHash = await baseWalletClient.writeContract({
      abi: IntentSourceAbi,
      address: intentSourceContract,
      functionName: 'publishAndFund',
      args: [quote.intentData, false],
      chain: originChain,
      account,
      value: quote.intentData.reward.nativeValue
    })

    await publicClient.waitForTransactionReceipt({ hash: publishTxHash })
  }, 20_000)
})