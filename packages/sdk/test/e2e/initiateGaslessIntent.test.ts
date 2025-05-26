import { describe, test, beforeAll, expect } from "vitest";
import { createWalletClient, Hex, webSocket, WalletClient, erc20Abi, createPublicClient } from "viem";
import { base, optimism } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import { EcoProtocolAddresses, IntentSourceAbi } from "@eco-foundation/routes-ts";

import { RoutesService, OpenQuotingClient, selectCheapestQuote, Permit1, Permit2, Permit2DataDetails } from "../../src/index.js";
import { PERMIT2_ADDRESS, signPermit, signPermit2 } from "../permit.js";
import { getSecondsFromNow } from "../../src/utils.js";
import { PermitAbi } from "../PermitAbi.js";
import { Permit2Abi } from "../Permit2Abi.js";

const account = privateKeyToAccount(process.env.VITE_TESTING_PK as Hex)

describe("initiateGaslessIntent", () => {
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

  test("gasless initiation with quote", async () => {
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

    const quotes = await openQuotingClient.requestQuotesForIntent({ intent, intentExecutionTypes: ["GASLESS"] })
    const { quoteID, solverID, quote } = selectCheapestQuote(quotes, false, ["GASLESS"]);

    const intentSource = EcoProtocolAddresses[routesService.getEcoChainId(originChain.id)].IntentSource
    // initiate gasless intent
    const vaultAddress = await publicClient.readContract({
      abi: IntentSourceAbi,
      address: intentSource,
      functionName: "intentVaultAddress",
      args: [quote.intentData]
    })

    // approve
    await Promise.all(quote.intentData.reward.tokens.map(async ({ token, amount }) => {
      const hash = await baseWalletClient.writeContract({
        abi: erc20Abi,
        address: token,
        functionName: "approve",
        args: [vaultAddress, amount],
        chain: originChain,
        account
      })

      await publicClient.waitForTransactionReceipt({ hash })
    }));

    // initiate gasless intent
    const response = await openQuotingClient.initiateGaslessIntent({
      funder: account.address,
      intent: quote.intentData,
      solverID,
      quoteID,
      vaultAddress,
    })

    expect(response).toBeDefined()
    expect(response.transactionHash).toBeDefined()
  }, 20_000);

  test("gasless initiation with reverse quote", async () => {
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

    const quotes = await openQuotingClient.requestReverseQuotesForIntent({ intent, intentExecutionTypes: ["GASLESS"] })
    const { quoteID, solverID, quote } = selectCheapestQuote(quotes, true, ["GASLESS"]);

    const intentSource = EcoProtocolAddresses[routesService.getEcoChainId(originChain.id)].IntentSource
    // initiate gasless intent
    const vaultAddress = await publicClient.readContract({
      abi: IntentSourceAbi,
      address: intentSource,
      functionName: "intentVaultAddress",
      args: [quote.intentData]
    })

    // approve
    await Promise.all(quote.intentData.reward.tokens.map(async ({ token, amount }) => {
      const hash = await baseWalletClient.writeContract({
        abi: erc20Abi,
        address: token,
        functionName: "approve",
        args: [vaultAddress, amount],
        chain: originChain,
        account
      })

      await publicClient.waitForTransactionReceipt({ hash })
    }));

    // initiate gasless intent
    const response = await openQuotingClient.initiateGaslessIntent({
      funder: account.address,
      intent: quote.intentData,
      solverID,
      quoteID,
      vaultAddress,
    })

    expect(response).toBeDefined()
    expect(response.transactionHash).toBeDefined()
  }, 20_000);

  test("gasless initiation with permit", async () => {
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

    const quotes = await openQuotingClient.requestQuotesForIntent({ intent, intentExecutionTypes: ["GASLESS"] })
    const { quoteID, solverID, quote } = selectCheapestQuote(quotes, true, ["GASLESS"]);

    const intentSource = EcoProtocolAddresses[routesService.getEcoChainId(originChain.id)].IntentSource
    // initiate gasless intent
    const vaultAddress = await publicClient.readContract({
      abi: IntentSourceAbi,
      address: intentSource,
      functionName: "intentVaultAddress",
      args: [quote.intentData]
    })

    // sign approval using USDC permit
    const deadline = Math.round(getSecondsFromNow(60 * 30).getTime() / 1000) // 30 minutes from now in UNIX seconds since epoch

    // for each reward token, generate a permit signature
    const permitData: Permit1 = {
      permit: await Promise.all(quote.intentData.reward.tokens.map(async ({ token, amount }) => {
        const tokenContract = {
          address: token,
          abi: PermitAbi,
        } as const
        const responses = await publicClient.multicall({
          contracts: [
            {
              ...tokenContract,
              functionName: 'nonces',
              args: [account.address],
            },
            {
              ...tokenContract,
              functionName: 'version',
            },
            {
              ...tokenContract,
              functionName: 'name',
            },
          ],
        })

        const [nonce, version, name] = [
          responses[0].result,
          responses[1].result,
          responses[2].result,
        ]

        const signature = await signPermit(baseWalletClient, {
          chainId: originChain.id,
          contractAddress: token,
          deadline: BigInt(deadline),
          erc20Name: name!,
          nonce: nonce || BigInt(0),
          ownerAddress: account.address,
          permitVersion: version,
          spenderAddress: vaultAddress,
          value: amount,
        })

        return {
          token,
          data: {
            signature,
            deadline: BigInt(deadline),
            nonce: nonce || BigInt(0),
          }
        }
      }))
    }

    // now initiate gaslessly with all the data
    const response = await openQuotingClient.initiateGaslessIntent({
      funder: account.address,
      intent: quote.intentData,
      solverID,
      quoteID,
      vaultAddress,
      permitData,
    })

    expect(response).toBeDefined()
    expect(response.transactionHash).toBeDefined()
  }, 20_000);

  test("gasless initiation with permit2", async () => {
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

    const quotes = await openQuotingClient.requestQuotesForIntent({ intent, intentExecutionTypes: ["GASLESS"] })
    const { quoteID, solverID, quote } = selectCheapestQuote(quotes, true, ["GASLESS"]);

    const intentSource = EcoProtocolAddresses[routesService.getEcoChainId(originChain.id)].IntentSource
    // initiate gasless intent
    const vaultAddress = await publicClient.readContract({
      abi: IntentSourceAbi,
      address: intentSource,
      functionName: "intentVaultAddress",
      args: [quote.intentData]
    })

    // sign approval using permit2 contract

    const deadline = Math.round(getSecondsFromNow(60 * 30).getTime() / 1000) // 30 minutes from now in UNIX seconds since epoch

    // for each reward token perform initial approval to the permit2 contract
    await Promise.all(quote.intentData.reward.tokens.map(async ({ token, amount }) => {
      const approvalTxHash = await baseWalletClient.writeContract({
        abi: erc20Abi,
        address: token,
        functionName: "approve",
        args: [PERMIT2_ADDRESS, amount],
        chain: originChain,
        account
      });

      await publicClient.waitForTransactionReceipt({ hash: approvalTxHash })
    }));

    // now create the permit2 data to pass to the initiate gasless endpoint

    const details: Permit2DataDetails[] = await Promise.all(quote.intentData.reward.tokens.map(async ({ token, amount }) => {
      // get nonce

      const currentAllowance = await publicClient.readContract({
        abi: Permit2Abi,
        address: PERMIT2_ADDRESS,
        functionName: "allowance",
        args: [account.address, token, vaultAddress]
      })

      const currentNonce = BigInt(currentAllowance[2])

      return {
        token,
        amount,
        expiration: BigInt(deadline),
        nonce: currentNonce,
      }
    }));

    const signature = await signPermit2(baseWalletClient, {
      chainId: originChain.id,
      expiration: BigInt(deadline),
      spender: vaultAddress,
      details,
    })

    const permitData: Permit2 = {
      permit2: {
        permitContract: PERMIT2_ADDRESS,
        permitData: details.length > 1 ? {
          batchPermitData: {
            typedData: {
              details,
              spender: vaultAddress,
              sigDeadline: BigInt(deadline),
            }
          }
        } : {
          singlePermitData: {
            typedData: {
              details: details[0]!,
              spender: vaultAddress,
              sigDeadline: BigInt(deadline),
            }
          }
        },
        signature,
      }
    }

    // now initate gaslessly
    const response = await openQuotingClient.initiateGaslessIntent({
      funder: account.address,
      intent: quote.intentData,
      solverID,
      quoteID,
      vaultAddress,
      permitData,
    })

    expect(response).toBeDefined()
    expect(response.transactionHash).toBeDefined()
  }, 45_000);
});