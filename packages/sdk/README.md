<div id="top"></div>

<br />
<div align="center">
  <a>
    <img src="https://i.ibb.co/9k7WHTVx/favicon.png" alt="Eco Logo" width="80" height="80">
  </a>
  <h3 align="center">Eco - Routes SDK</h3>
</div>
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#installing">Installing</a></li>
        <li><a href="#eco-routes-peer-dependency">Eco Routes Peer Dependency</a></li>
        <li><a href="#quick-start">Quick Start</a></li>
      </ul>
    </li>
    <li>
      <a href="#refunding-expired-intents">Refunding Expired Intents</a>
    </li>
    <li>
      <a href="#custom-chains-and-contracts-optional">Custom Chains and Contracts (optional)</a>
    </li>
    <li>
      <a href="#full-demo">Full Demo</a>
    </li>
    <li>
      <a href="#testing">Testing</a>
    </li>
    <li>
      <a href="#development">Development</a>
    </li>
    <li>
      <a href="#build">Build</a>
    </li>
  </ol>
</details>
<br>

# Getting Started

## Installing
Install the package and the [`@eco-foundation/routes-ts`](https://npmjs.com/package/@eco-foundation/routes-ts) peer dependency to your project:
``` sh
npm install @eco-foundation/routes-sdk @eco-foundation/routes-ts
```

## Eco Routes peer dependency

The Eco team is constantly improving our protocol. Sometimes, this involves making upgrades to our contracts, which will generate new contract addresses that we will publish in our routes-ts package. When this happens, be aware that if your application is still running with an outdated version of the routes-ts package, some intents might not get fulfilled.

Upgrading to the latest protocol contracts is easy! Simply run:
``` sh
npm install @eco-foundation/routes-ts@latest
```
To install the latest contracts, and the SDK will automatically use them.

> **Note:** Upgrading the routes-ts package by a minor or major version might require upgrading the SDK as well, run:
```
npm install @eco-foundation/routes-sdk@latest
```
*To install the latest version of the SDK.*

## Quick Start

### Create a simple intent
To create a simple stable send intent, create an instance of the `RoutesService` and call `createSimpleIntent` with the required parameters:
``` ts
import { RoutesService } from '@eco-foundation/routes-sdk'

const address = '0x1234567890123456789012345678901234567890'
const originChainID = 10
const spendingToken = RoutesService.getStableAddress(originChainID, 'USDC')
const spendingTokenLimit = BigInt(10000000) // 10 USDC
const destinationChainID = 8453
const receivingToken = RoutesService.getStableAddress(destinationChainID, 'USDC')

const amount = BigInt(1000000) // 1 USDC

const routesService = new RoutesService()

// create a simple stable transfer from my wallet on the origin chain to my wallet on the destination chain
const intent = routesService.createSimpleIntent({
  creator: address,
  originChainID,
  spendingToken,
  spendingTokenLimit,
  destinationChainID,
  receivingToken,
  amount,
  recipient: address, // optional, defaults to the creator if not passed
})
```

### Create a native send intent
To create a native token (ETH, MATIC, etc.) send intent, use the `createNativeSendIntent` method:
``` ts
import { RoutesService } from '@eco-foundation/routes-sdk';

const address = '0x1234567890123456789012345678901234567890';
const originChainID = 10; // Optimism
const destinationChainID = 8453; // Base
const amount = BigInt("10000000000000000"); // 0.01 ETH (in wei)
const limit = BigInt("1000000000000000000"); // 1 ETH

const routesService = new RoutesService();

// create a native token send from my wallet on the origin chain to my wallet on the destination chain
const intent = routesService.createNativeSendIntent({
  creator: address,
  originChainID,
  destinationChainID,
  amount,
  limit,
  recipient: address, // optional, defaults to the creator if not passed
})
```

### Request quotes for an intent and select a quote
To request quotes for an intent and select the cheapest quote, use the `OpenQuotingClient` and `selectCheapestQuote` functions.

Each quote includes a modified intent that is adjusted to account for the fees that the solver will charge.
``` ts
import { OpenQuotingClient, selectCheapestQuote, selectCheapestQuoteNativeSend } from '@eco-foundation/routes-sdk';

const openQuotingClient = new OpenQuotingClient({ dAppID: 'my-dapp' })

try {
  const quotes = await openQuotingClient.requestQuotesForIntent({ intent })

  // select quote
  const selectedQuote = selectCheapestQuote(quotes);
  // OR, for native send intents
  const selectedQuote = selectCheapestQuoteNativeSend(quotes);

  const quotedIntent = selectedQuote.quote.intentData
}
catch (error) {
  console.error('No quotes available for intent', error)
}
```

### \**NEW*\* Requesting a reverse quote

Primarily our quoting system is designed to add fees to the source amounts. The intent is that you are asking for a certain destination operation to be done and that operation has a fixed cost. However most crypto bridges today allow users to specify a source amount and will then calculate the destination amount you will receive. Because this was such a widely used pattern we have added a new quoting option that we refer to as *reverse quoting*.

Requesting a reverse quote is slightly different in the way you create the intent, request quotes, and select a quote.

#### Creating an intent for a reverse quote

When you are creating an intent for a reverse quote, your `spendingTokenLimit` is the immutable amount you want to send on the source chain, rather than the maximum amount you are willing to pay for the destination operation. Similarily, the `amount` you pass in is the maximum destination amount you want to receive on the destination chain, which will be reduced based on any fees applied. 

#### Requesting quotes for a reverse quote

If the source amount you provide results in a destination amount that is 0 or less, your request for a quote will throw an error.

``` ts
import { OpenQuotingClient, selectCheapestQuote } from '@eco-foundation/routes-sdk'

const openQuotingClient = new OpenQuotingClient({ dAppID: 'my-dapp' })

try {
  const quotes = await openQuotingClient.requestReverseQuotesForIntent({ intent })

  // select quote
  const selectedQuote = selectCheapestQuote(quotes, { isReverse: true });
  // OR, for native send intents
  const selectedQuote = selectCheapestQuoteNativeSend(quotes, { isReverse: true });

  const quotedIntent = selectedQuote.quote.intentData
}
catch (error) {
  console.error('No reverse quotes available for intent', error)
}
```

#### Custom selectors (optional)
Depending on your use case, you might want to select some quote based on some other criteria, not just the cheapest. You can create a custom selector function to do this.

``` ts
import { SolverQuote, QuoteSelectorOptions, QuoteSelectorResult } from '@eco-foundation/routes-sdk'

// custom selector fn using SolverQuote type
function selectMyFavoriteQuote(solverQuotes: SolverQuote[], opts: QuoteSelectorOptions): QuoteSelectorResult {
  const { isReverse = false, allowedIntentExecutionTypes = ['SELF_PUBLISH'] } = opts;
  // your custom logic here
  return {
    intentData,
    solverID,
    quoteID,
  }
}
```

#### Implications of not requesting a quote
If you do not request a quote for your intent and you continue with publishing it, you risk the possibility of your intent not being fulfilled by any solvers (because of an insufficient token limit) or losing any surplus amount from your `spendingTokenLimit` that the solver didn't need to fulfill your intent. This is why requesting a quote is **strongly recommended**.

### Publishing the intent onchain
The SDK gives you what you need so that you can publish the intent to the origin chain with whatever web3 library you choose, here is an example of how to publish our quoted intent using `viem`!

``` ts
import { createWalletClient, createPublicClient, privateKeyToAccount, webSocket, http, erc20Abi } from 'viem';
import { optimism } from 'viem/chains';
import { IntentSourceAbi } from '@eco-foundation/routes-ts';

const account = privateKeyToAccount('YOUR PRIVATE KEY HERE')
const originChain = optimism

const rpcUrl = 'YOUR RPC URL'
const originWalletClient = createWalletClient({
  account,
  transport: webSocket(rpcUrl) // OR http(rpcUrl)
})
const originPublicClient = createPublicClient({
  chain: originChain,
  transport: webSocket(rpcUrl) // OR http(rpcUrl)
})

const intentSourceContract = routesService.getProtocolContractAddress(originChain.id, 'IntentSource');

try {
  // approve the quoted amount to account for fees
  await Promise.all(quotedIntent.reward.tokens.map(async ({ token, amount }) => {
    const approveTxHash = await originWalletClient.writeContract({
      abi: erc20Abi,
      address: token,
      functionName: 'approve',
      args: [intentSourceContract, amount],
      chain: originChain,
      account
    })

    await originPublicClient.waitForTransactionReceipt({ hash: approveTxHash })
  }))

  const publishTxHash = await originWalletClient.writeContract({
    abi: IntentSourceAbi,
    address: intentSourceContract,
    functionName: 'publishAndFund',
    args: [quotedIntent, false],
    chain: originChain,
    account,
    value: intentWithQuote.reward.nativeValue // Send the required native value if applicable
  })

  await originPublicClient.waitForTransactionReceipt({ hash: publishTxHash })
}
catch (error) {
  console.error('Intent creation failed', error)
}
```

[See more from viem's docs](https://viem.sh/)

## Initiate the intent gaslessly
Eco's solver provides the option to initiate an intent gaslessly using permit or permit2. By signing your approvals for source tokens, and then passing your intent to our open quoting API. Here is an example of how to do this:

As a preliminary step for permit2 you need to ensure that the funder of the intent has permitted for the Permit2 contract to spend token on their behalf. This is done by calling `approve` on the tokens that you are spending on the source chain. This is the only operation that requires a transaction to be sent to the source chain.

``` ts
import { createWalletClient, createPublicClient, privateKeyToAccount, webSocket, http, erc20Abi } from 'viem'
import { optimism } from 'viem/chains'
import { IntentSourceAbi, EcoProtocolAddresses } from '@eco-foundation/routes-ts'

const account = privateKeyToAccount('YOUR PRIVATE KEY HERE')
const originChain = optimism

const rpcUrl = 'YOUR RPC URL'
const originWalletClient = createWalletClient({
  account,
  transport: webSocket(rpcUrl) // OR http(rpcUrl)
})
const originPublicClient = createPublicClient({
  chain: originChain,
  transport: webSocket(rpcUrl) // OR http(rpcUrl)
})

const intentSourceContract = EcoProtocolAddresses[routesService.getEcoChainId(originChain.id)].IntentSource

const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3'

// initial permit2 approvals
await Promise.all(quotedIntent.reward.tokens.map(async ({ token, amount }) => {
  const approveTxHash = await originWalletClient.writeContract({
    abi: erc20Abi,
    address: token,
    functionName: 'approve',
    args: [PERMIT2_ADDRESS, amount],
    chain: originChain,
    account
  })

  await originPublicClient.waitForTransactionReceipt({ hash: approveTxHash })
}))
```

Once the permit2 contract has been approved to spend the tokens, you can create a permit2 signature for the tokens to be spent. Unlike when publishing directly, the spender will be a vault address. Each intent has a unique vault address that is created to fund the intent. First we get the address via the IntentSource contract by calling `getIntentVaultAddress` with the intent. Then we can create a permit2 signature for the tokens to be spent.

``` ts
import { Permit2, Permit2Abi, Permit2DataDetails } from '@eco-foundation/routes-sdk'

// get vault address from IntentSource contract
const vaultAddress = await originPublicClient.readContract({
  abi: IntentSourceAbi,
  address: intentSourceContract,
  functionName: 'intentVaultAddress',
  args: [quotedIntent]
})

// 30 minutes from now in UNIX seconds since epoch
const deadline = Math.round((Date.now() + 30 * 60 * 1000) / 1000)

// create permit2 details
const details: Permit2DataDetails[] = await Promise.all(quotedIntent.reward.tokens.map(async ({ token, amount }) => {
  // get nonce from Permit2 contract
  const currentAllowance = await originPublicClient.readContract({
    abi: Permit2Abi,
    address: PERMIT2_ADDRESS,
    functionName: 'allowance',
    args: [account.address, token, vaultAddress]
  })

  const currentNonce = BigInt(currentAllowance[2])

  return {
    token,
    amount,
    expiration: BigInt(deadline),
    nonce: currentNonce,
  }
}))

// Supplement this with your own permit2 signing function
const signature = await signPermit2(...)

// now setup permit2 data to pass to the API
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
          details: details[0],
          spender: vaultAddress,
          sigDeadline: BigInt(deadline),
        }
      }
    },
    signature,
  }
}
```

Now, we can pass the permit2 data and quoted intent to the `initiateGaslessIntent` function. This will return a transaction hash that can be used to track the intent until it is fulfilled.

``` ts
const { initiateTxHash } = await openQuotingClient.initiateGaslessIntent({
  funder: account.address,
  intent: quotedIntent,
  solverID: selectedQuote.solverID,
  quoteID: selectedQuote.quoteID,
  vaultAddress,
  permitData
})

await originPublicClient.waitForTransactionReceipt({ hash: initiateTxHash })
```

[See more from Uniswap's Permit2 docs](https://blog.uniswap.org/permit2-integration-guide#how-to-construct-permit2-signatures-on-the-frontend)
## Refunding Expired Intents

If an intent expires before it's fulfilled by a solver, you can refund the tokens you deposited when creating the intent. To do this, you'll need the original intent data, which you can retrieve from the `IntentCreated` event log that was emitted when you published the intent.

### Parsing Intent from Event Log

When you publish an intent, the transaction receipt will contain an `IntentCreated` event. You can parse this event to get the intent data needed for refunding:

```ts
import { parseEventLogs } from 'viem';
import { IntentSourceAbi } from '@eco-foundation/routes-ts';
import { RoutesService } from '@eco-foundation/routes-sdk';

// After publishing intent, get the transaction receipt
const receipt = await publicClient.waitForTransactionReceipt({ hash: publishTxHash });

// Parse the logs to find the IntentCreated event
const logs = parseEventLogs({
  abi: IntentSourceAbi,
  logs: receipt.logs
});

const intentCreatedEvent = logs.find((log) => log.eventName === 'IntentCreated');

// Parse the intent from the event arguments
const parsedIntent = RoutesService.parseIntentFromIntentCreatedEventArgs(intentCreatedEvent!.args);
```

### Executing the Refund

Once you have the parsed intent and it has expired, you can call the `refund` function on the `IntentSource` contract:

```ts
import { IntentSourceAbi } from '@eco-foundation/routes-ts';

const intentSourceContract = routesService.getProtocolContractAddress(originChain.id, 'IntentSource');

// Make sure the intent has expired before attempting refund
const currentTime = new Date();
if (currentTime > parsedIntent.expiryTime) {
  const refundTxHash = await walletClient.writeContract({
    abi: IntentSourceAbi,
    address: intentSourceContract,
    functionName: 'refund',
    args: [parsedIntent],
    chain: originChain,
    account
  });

  await publicClient.waitForTransactionReceipt({ hash: refundTxHash });
  console.log('Refund successful!');
} else {
  console.log('Intent has not expired yet');
}
```

## Custom Chains and Contracts (optional)
The SDK is designed to work with the [@eco-foundation/routes-ts](https://www.npmjs.com/package/@eco-foundation/routes-ts) package, which provides the default chains and contracts. However, you can pass custom chains and contracts to the SDK if needed.

To do this, you can create a custom `RoutesService` instance with your own chains and contracts:
``` ts
import { RoutesService, ProtocolAddresses } from '@eco-foundation/routes-sdk';

const customProtocolAddresses: ProtocolAddresses = {
  123456789: {
    IntentSource: '0x1234567890123456789012345678901234567890',
    MetaProver: '0x0987654321098765432109876543210987654321',
  },
  "123456789-pre": { // preprod contracts
    IntentSource: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    MetaProver: '0x1234567890123456789012345678901234567890',
  }
}

const routesService = new RoutesService({
  customProtocolAddresses,
})
```

> **Note:** Custom contract addresses passed on already-supported chains will override any default addresses from [@eco-foundation/routes-ts](https://www.npmjs.com/package/@eco-foundation/routes-ts).

# Full Demo

For a full example of creating an intent and tracking it until it's fulfilled, see the [Eco Routes SDK Demo](https://github.com/eco/toolkit/tree/main/apps/sdk-demo).

# Testing

First, create a .env file in the sdk directory and populate it with all the environment variables listed in [`.env.example`](./.env.example). Then to run tests, run:
``` sh
npm run test
```

# Development

Run development mode:
``` sh
npm run dev
```

# Build

Run build:
``` sh
npm run build
```