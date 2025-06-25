import { RoutesService, RoutesSupportedChainId, SolverQuote, IntentExecutionType, OpenQuotingClient, Permit1, Permit2, Permit2DataDetails } from "@eco-foundation/routes-sdk"
import { IntentSourceAbi, InboxAbi, EcoProtocolAddresses } from "@eco-foundation/routes-ts"
import { useCallback, useState, useMemo } from "react"
import { useAccount, useSwitchChain, useWriteContract, useReadContract, usePublicClient } from "wagmi"
import { getBlockNumber, waitForTransactionReceipt, watchContractEvent, readContract } from "@wagmi/core"
import { erc20Abi, Hex, parseEventLogs } from "viem"
import { config, ecoChains } from "../../../wagmi"
import { PermitAbi, Permit2Abi } from "../../../utils/abis"
import { isUSDC, signPermit, signPermit2, PERMIT2_ADDRESS } from "../../../utils/permit"

type Props = {
  routesService: RoutesService,
  quotes: SolverQuote[] | undefined,
  quote: SolverQuote | undefined,
  isNativeIntent?: boolean,
  openQuotingClient: OpenQuotingClient
}

export default function PublishIntent({ routesService, quotes, quote, isNativeIntent, openQuotingClient }: Props) {
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();

  const { writeContractAsync } = useWriteContract();
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [selectedExecutionType, setSelectedExecutionType] = useState<IntentExecutionType>("SELF_PUBLISH");

  const [approvalTxHashes, setApprovalTxHashes] = useState<Hex[]>([]);
  const [publishTxHash, setPublishTxHash] = useState<Hex | undefined>();
  const [fulfillmentTxHash, setFulfillmentTxHash] = useState<Hex | undefined>();

  const handleExecutionTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedExecutionType(event.target.value as IntentExecutionType);
  };

  // TODO: use getVaultAddress asynchronously because it's not needed for self publish, only gasless
  // TODO: fix self publish and gasless code snippets to actually look like the actual code not some pseduocode

  // Get the selected quote entry and its intentData
  const selectedQuoteEntry = useMemo(() => {
    if (!quote) return null;
    return quote.quoteData.quoteEntries.find(entry => entry.intentExecutionType === selectedExecutionType);
  }, [quote, selectedExecutionType]);

  // Extract source chain ID from intentData in the selected quote entry
  const sourceChainID = useMemo(() => {
    if (!selectedQuoteEntry) return undefined;
    return Number(selectedQuoteEntry.intentData.route.source);
  }, [selectedQuoteEntry]);

  // Get vault address for gasless execution
  const { data: vaultAddress } = useReadContract({
    chainId: sourceChainID,
    abi: IntentSourceAbi,
    address: sourceChainID ? EcoProtocolAddresses[routesService.getEcoChainId(sourceChainID as RoutesSupportedChainId)].IntentSource : undefined,
    functionName: 'intentVaultAddress',
    query: { enabled: Boolean(sourceChainID && quote && selectedExecutionType === "GASLESS") }
  });

  // Extract available execution types and corresponding quote entries
  const availableExecutionTypes = useMemo(() => {
    if (!quote) return [];
    return quote.quoteData.quoteEntries.map(entry => entry.intentExecutionType);
  }, [quote]);

  // Set initial execution type when quote changes
  useMemo(() => {
    if (quote && availableExecutionTypes.length > 0 && !availableExecutionTypes.includes(selectedExecutionType)) {
      setSelectedExecutionType(availableExecutionTypes[0]!);
    }
  }, [quote, availableExecutionTypes, selectedExecutionType]);

  const waitForFulfillment = async (intentHash: Hex, destinationChainId: number, inbox: Hex) => {
    const blockNumber = await getBlockNumber(config, { chainId: destinationChainId as RoutesSupportedChainId });

    return new Promise<Hex>((resolve, reject) => {
      const unwatch = watchContractEvent(config, {
        fromBlock: blockNumber - BigInt(10),
        chainId: destinationChainId as RoutesSupportedChainId,
        abi: InboxAbi,
        eventName: 'Fulfillment',
        address: inbox,
        args: {
          _hash: intentHash
        },
        onLogs(logs) {
          if (logs && logs.length > 0) {
            const fulfillmentTxHash = logs[0]!.transactionHash;
            unwatch();
            resolve(fulfillmentTxHash);
          }
        },
        onError(error) {
          unwatch();
          reject(error);
        }
      });
    });
  };

  // Extract destination chain ID and inbox from intentData in the selected quote entry
  const destinationChainID = useMemo(() => {
    if (!selectedQuoteEntry) return undefined;
    return Number(selectedQuoteEntry.intentData.route.destination);
  }, [selectedQuoteEntry]);

  const inboxAddress = useMemo(() => {
    if (!selectedQuoteEntry) return undefined;
    return selectedQuoteEntry.intentData.route.inbox as Hex;
  }, [selectedQuoteEntry]);

  const publishIntent = useCallback(async () => {
    if (!quote || !address || !selectedQuoteEntry || !publicClient || !sourceChainID) return;
    try {
      setIsPublishing(true);

      // Get the intentData from the selected quote entry
      const intentData = selectedQuoteEntry.intentData;

      let intentHash: Hex | undefined;
      const intentSourceContract = routesService.getProtocolContractAddress(sourceChainID, "IntentSource")

      // Handle based on execution type
      if (selectedExecutionType === "SELF_PUBLISH") {
        // Approve tokens for the IntentSource contract
        const approveTxHashes = await Promise.all(intentData.reward.tokens.map((rewardToken) => writeContractAsync({
          chainId: sourceChainID,
          abi: erc20Abi,
          functionName: 'approve',
          address: rewardToken.token,
          args: [intentSourceContract, rewardToken.amount]
        })));

        await Promise.all(approveTxHashes.map((txHash) => waitForTransactionReceipt(config, { hash: txHash })));
        setApprovalTxHashes(approveTxHashes);

        // Publish and fund the intent
        const publishTxHash = await writeContractAsync({
          chainId: sourceChainID,
          abi: IntentSourceAbi,
          functionName: 'publishAndFund',
          address: intentSourceContract,
          args: [intentData, false],
          value: isNativeIntent ? intentData.reward.nativeValue : BigInt(0)
        });

        const receipt = await waitForTransactionReceipt(config, { hash: publishTxHash });
        const logs = parseEventLogs({
          abi: IntentSourceAbi,
          logs: receipt.logs
        });

        const intentCreatedEvent = logs.find((log) => log.eventName === 'IntentCreated');
        if (!intentCreatedEvent) {
          throw new Error('IntentCreated event not found in logs');
        }

        intentHash = intentCreatedEvent.args.hash as Hex;
        setPublishTxHash(publishTxHash);
      }
      else if (selectedExecutionType === "GASLESS") {
        // Check if we have the vault address
        if (!vaultAddress) {
          throw new Error("Vault address not available");
        }

        // Process for gasless execution with permit or permit2
        const deadline = BigInt(Math.round(new Date(Date.now() + 60 * 1000).getTime() / 1000)); // 30 minutes from now in UNIX seconds
        let permitData: Permit1 | Permit2 | undefined;
        const approveTxHashes: Hex[] = [];

        // Group tokens by whether they support permit or need permit2
        const tokens = intentData.reward.tokens;
        const usdcTokens = tokens.filter(token => isUSDC(token.token));
        const nonUsdcTokens = tokens.filter(token => !isUSDC(token.token));

        // Process USDC tokens with Permit (EIP-2612)
        if (usdcTokens.length > 0) {
          const permitSignatures = await Promise.all(usdcTokens.map(async ({ token, amount }) => {
            // Fetch token details for permit signing
            const tokenContract = {
              address: token,
              abi: PermitAbi,
            } as const;

            const [nonceResult, versionResult, nameResult] = await Promise.all([
              readContract(config, {
                ...tokenContract,
                functionName: 'nonces',
                args: [address],
                chainId: sourceChainID as RoutesSupportedChainId,
              }) as Promise<bigint>,
              readContract(config, {
                ...tokenContract,
                functionName: 'version',
                chainId: sourceChainID as RoutesSupportedChainId,
              }) as Promise<string>,
              readContract(config, {
                ...tokenContract,
                functionName: 'name',
                chainId: sourceChainID as RoutesSupportedChainId,
              }) as Promise<string>,
            ]);

            // Sign the permit
            const signature = await signPermit({
              contractAddress: token,
              erc20Name: nameResult,
              ownerAddress: address,
              spenderAddress: vaultAddress as Hex,
              value: BigInt(amount),
              deadline,
              nonce: nonceResult || BigInt(0),
              chainId: sourceChainID,
              permitVersion: versionResult,
            });

            return {
              token,
              data: {
                signature,
                deadline,
              }
            };
          }));

          // Create Permit1 data
          permitData = {
            permit: permitSignatures
          } as Permit1;
        }

        // Process non-USDC tokens with Permit2
        if (nonUsdcTokens.length > 0) {
          // Approve tokens for the Permit2 contract
          for (const { token, amount } of nonUsdcTokens) {
            // Check current allowance
            const currentAllowance = await readContract(config, {
              chainId: sourceChainID as RoutesSupportedChainId,
              abi: erc20Abi,
              functionName: 'allowance',
              address: token,
              args: [address, PERMIT2_ADDRESS]
            }) as bigint;

            // Only approve if current allowance is less than the required amount
            if (currentAllowance < BigInt(amount)) {
              // Approve max uint256 value
              const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
              const approvalTxHash = await writeContractAsync({
                chainId: sourceChainID,
                abi: erc20Abi,
                functionName: 'approve',
                address: token,
                args: [PERMIT2_ADDRESS, maxUint256]
              });

              await waitForTransactionReceipt(config, { hash: approvalTxHash });
              approveTxHashes.push(approvalTxHash);
            }
          }

          // Get current nonces from Permit2 contract
          const details: Permit2DataDetails[] = await Promise.all(nonUsdcTokens.map(async ({ token, amount }) => {
            const currentAllowance = await readContract(config, {
              abi: Permit2Abi,
              address: PERMIT2_ADDRESS,
              functionName: "allowance",
              args: [address, token, vaultAddress as Hex],
              chainId: sourceChainID as RoutesSupportedChainId,
            });

            const currentNonce = BigInt(currentAllowance[2]);

            return {
              token,
              amount: BigInt(amount),
              expiration: deadline,
              nonce: currentNonce,
            };
          }));

          // Sign the permit2 data
          const signature = await signPermit2({
            chainId: sourceChainID,
            expiration: deadline,
            spender: vaultAddress as Hex,
            details,
          });

          // Create Permit2 data
          permitData = {
            permit2: {
              permitContract: PERMIT2_ADDRESS,
              permitData: details.length > 1
                ? {
                  batchPermitData: {
                    typedData: {
                      details,
                      spender: vaultAddress as Hex,
                      sigDeadline: deadline,
                    }
                  }
                }
                : {
                  singlePermitData: {
                    typedData: {
                      details: details[0]!,
                      spender: vaultAddress as Hex,
                      sigDeadline: deadline,
                    }
                  }
                },
              signature,
            }
          } as Permit2;
        }

        // Update approval transaction hashes
        if (approveTxHashes.length > 0) {
          setApprovalTxHashes(approveTxHashes);
        }

        // Initiate the gasless intent with or without permit data
        const gaslessResponse = await openQuotingClient.initiateGaslessIntent({
          funder: address,
          intent: intentData,
          quoteID: quote.quoteID,
          solverID: quote.solverID,
          vaultAddress: vaultAddress as Hex,
          permitData,
        });

        setPublishTxHash(gaslessResponse.transactionHash as Hex);

        // Wait for transaction receipt to get the IntentFunded event
        const receipt = await waitForTransactionReceipt(config, { hash: gaslessResponse.transactionHash as Hex });

        // Parse logs to find the IntentFunded event and get the intent hash
        const logs = parseEventLogs({
          abi: IntentSourceAbi,
          logs: receipt.logs
        });

        const intentFundedEvent = logs.find((log) => log.eventName === 'IntentFunded');
        if (!intentFundedEvent) {
          throw new Error('IntentFunded event not found in logs');
        }

        intentHash = intentFundedEvent.args.intentHash as Hex;
      } else {
        throw new Error(`Execution type ${selectedExecutionType} not supported`);
      }

      // Wait for fulfillment on destination chain
      if (intentHash && destinationChainID && inboxAddress) {
        const fulfillmentTxHash = await waitForFulfillment(
          intentHash,
          destinationChainID,
          inboxAddress
        );

        setFulfillmentTxHash(fulfillmentTxHash);
        setIsPublished(true);
      }
    }
    catch (error) {
      alert('Could not publish intent: ' + (error as Error).message);
      console.error(error);
    }
    finally {
      setIsPublishing(false);
    }
  }, [quote, writeContractAsync, routesService, selectedExecutionType, selectedQuoteEntry, sourceChainID, destinationChainID, inboxAddress, vaultAddress, address, publicClient, isNativeIntent, openQuotingClient]);

  if (!quote) return null;

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
                  <span>Intent {selectedExecutionType === "GASLESS" ? "Initiated" : "Published"}:</span>
                  <span>{publishTxHash}</span>
                </div>
              ) : <span>{selectedExecutionType === "GASLESS" ? "Initiating" : "Publishing"}..</span>}

              {fulfillmentTxHash ? (
                <div>
                  <span>Intent fulfilled:</span>
                  <span>{fulfillmentTxHash}</span>
                </div>
              ) : <span>Waiting for fulfillment..</span>}

              {isPublished && (
                <div className="flex gap-4 align-center">
                  <span>Intent {selectedExecutionType === "GASLESS" ? "initiated" : "published"} and fulfilled!</span>
                  <button onClick={() => window.location.reload()}>Restart</button>
                </div>
              )}
            </div>
          ) : (<>
            {
              sourceChainID && chainId !== sourceChainID ? (
                <button
                  className="p-1 mb-2 bg-blue-500 text-white hover:bg-blue-600"
                  onClick={() => switchChain({ chainId: sourceChainID })}
                >
                  Switch to {ecoChains.getChain(sourceChainID).name}
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="executionType">Select Execution Type:</label>
                    <select
                      id="executionType"
                      className="p-1 border"
                      value={selectedExecutionType}
                      onChange={handleExecutionTypeChange}
                    >
                      {availableExecutionTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    className="p-1 mt-2 bg-blue-500 text-white hover:bg-blue-600"
                    onClick={publishIntent}
                  >
                    {selectedExecutionType === "GASLESS"
                      ? "Approve and Initiate Gasless Intent"
                      : "Approve and Publish Intent"}
                  </button>
                </div>
              )
            }
          </>)
          }
        </div >
        <div>
          <pre className="text-xs">
            {`${quotes && quote ? `// ${selectedExecutionType} execution
${selectedExecutionType === "GASLESS"
                ? `const vaultAddress = await contract.intentVaultAddress();
const openQuotingClient = routesService.getOpenQuotingClient();
const selectedQuote = quotes[${quotes.indexOf(quote)}];
const quoteEntry = selectedQuote.quoteData.quoteEntries.find(
  entry => entry.intentExecutionType === "GASLESS"
);
const intentData = quoteEntry?.intentData;

const result = await openQuotingClient.initiateGaslessIntent({
  funder: "${address}",
  intent: intentData,
  quoteID: "${quote.quoteID}",
  solverID: "${quote.solverID}",
  vaultAddress
});`
                : `const selectedQuote = quotes[${quotes.indexOf(quote)}];
const quoteEntry = selectedQuote.quoteData.quoteEntries.find(
  entry => entry.intentExecutionType === "SELF_PUBLISH"
);
const intentData = quoteEntry?.intentData;

// Publish and fund using the intentData from the selected quote
const publishTxHash = await writeContractAsync({
  chainId: Number(intentData.route.source),
  abi: IntentSourceAbi,
  functionName: 'publishAndFund',
  address: intentSourceContract,
  args: [intentData, false]
});`}` : undefined}`}
          </pre>
        </div>
      </div >
    </div >
  )
}