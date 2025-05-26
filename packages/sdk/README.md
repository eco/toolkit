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
import { RoutesService } from '@eco-foundation/routes-sdk';

const address = '0x1234567890123456789012345678901234567890';
const originChainID = 10;
const spendingToken = RoutesService.getStableAddress(originChainID, 'USDC');
const spendingTokenLimit = BigInt(10000000); // 10 USDC
const destinationChainID = 8453;
const receivingToken = RoutesService.getStableAddress(destinationChainID, 'USDC');

const amount = BigInt(1000000); // 1 USDC

const routesService = new RoutesService();

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
const amount = BigInt(1000000000000000000); // 1 ETH (in wei)

const routesService = new RoutesService();

// create a native token send from my wallet on the origin chain to my wallet on the destination chain
const intent = routesService.createNativeSendIntent({
  creator: address,
  originChainID,
  destinationChainID,
  amount,
  recipient: address, // optional, defaults to the creator if not passed
})
```

### Request quotes for an intent and select a quote (recommended)
To request quotes for an intent and select the cheapest quote, use the `OpenQuotingClient` and `selectCheapestQuote` functions.

Then, you can apply the quote by calling `applyQuoteToIntent` on the `RoutesService` instance:
``` ts
import { OpenQuotingClient, selectCheapestQuote } from '@eco-foundation/routes-sdk';

const openQuotingClient = new OpenQuotingClient({ dAppID: 'my-dapp' });

try {
  const quotes = await openQuotingClient.requestQuotesForIntent(intent);

  // select quote
  const selectedQuote = selectCheapestQuote(quotes);

  // apply quote to intent
  const intentWithQuote = routesService.applyQuoteToIntent({ intent, quote: selectedQuote });
}
catch (error) {
  console.error('Quotes not available', error);
}
```

#### Custom selectors (optional)
Depending on your use case, you might want to select some quote based on some other criteria, not just the cheapest. You can create a custom selector function to do this.

``` ts
import { SolverQuote } from '@eco-foundation/routes-sdk';

// custom selector fn using SolverQuote type
export function selectMostExpensiveQuote(quotes: SolverQuote[]): SolverQuote {
  return quotes.reduce((mostExpensive, quote) => {
    const mostExpensiveSum = mostExpensive ? sum(mostExpensive.quoteData.tokens.map(({ balance }) => balance)) : BigInt(-1);
    const quoteSum = sum(quote.quoteData.tokens.map(({ balance }) => balance));
    return quoteSum > mostExpensiveSum ? quote : mostExpensive;
  });
}
```

#### Implications of not requesting a quote
If you do not request a quote for your intent and you continue with publishing it, you risk the possibility of your intent not being fulfilled by any solvers (because of an insufficient token limit) or losing any surplus amount from your `spendingTokenLimit` that the solver didn't need to fulfill your intent. This is why requesting a quote is **strongly recommended**.

### Publishing the intent
The SDK gives you what you need so that you can publish the intent to the origin chain with whatever web3 library you choose, here is an example of how to publish our quoted intent using `viem`!

``` ts
import { createWalletClient, privateKeyToAccount, webSocket, http, erc20Abi } from 'viem';
import { optimism } from 'viem/chains';
import { IntentSourceAbi, EcoProtocolAddresses } from '@eco-foundation/routes-ts';

const account = privateKeyToAccount('YOUR PRIVATE KEY HERE')
const originChain = optimism;

const rpcUrl = 'YOUR RPC URL'
const originWalletClient = createWalletClient({
  account,
  transport: webSocket(rpcUrl) // OR http(rpcUrl)
})
const originPublicClient = createPublicClient({
  chain: originChain,
  transport: webSocket(rpcUrl) // OR http(rpcUrl)
})

const intentSourceContract = EcoProtocolAddresses[routesService.getEcoChainId(originChain.id)].IntentSource;

try {
  // approve the quoted amount to account for fees
  await Promise.all(intentWithQuote.reward.tokens.map(async ({ token, amount }) => {
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
    args: [intentWithQuote, false],
    chain: originChain,
    account
  })

  await originPublicClient.waitForTransactionReceipt({ hash: publishTxHash })
}
catch (error) {
  console.error('Intent creation failed', error)
}
```

#### Publishing a native send intent
For native token (ETH, MATIC, etc.) send intents, you need to provide the native value when publishing:

```ts
const publishTxHash = await originWalletClient.writeContract({
  abi: IntentSourceAbi,
  address: intentSourceContract,
  functionName: 'publishAndFund',
  args: [intentWithQuote, false],
  chain: originChain,
  account,
  value: intentWithQuote.reward.nativeValue // Send the required native value
})
```

[See more from viem's docs](https://viem.sh/)

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