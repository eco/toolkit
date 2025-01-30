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
      <a href="#full-examples">Full Examples</a>
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
Install the package and the [@eco-foundation/routes-ts](https://npmjs.com/package/@co-foundation/routes-ts) peer dependency to your project:
``` sh
npm install @eco-foundation/routes-sdk @eco-foundation/routes-ts
```

## Eco Routes peer dependency

The Eco team is constantly improving our protocol and sometimes that involves making upgrades to our contracts, which will generate new contract addresses that we will publish in our routes-ts package. When this happens be aware that if your application is still running with an outdated version of the routes-ts package some intents might not get fulfilled.

Upgrading to the latest protocol contracts is easy! Simply run:
``` sh
npm install @eco-foundation/routes-ts@latest
```
To install the latest contracts, and the SDK will use them.

Note: Upgrading the routes-ts package by a minor or major version might require upgrading the SDK as well, run:
```
npm install @eco-foundation/routes-sdk@latest
```
To install the latest version of the SDK.

## Quick Start

### Create a simple intent
To create a simple stable send intent, create an instance of the `RoutesService` and call `createSimpleIntent`. Pass in the required parameters

``` ts
import { RoutesService, SimpleIntentActionData } from '@eco-foundation/routes-sdk';

const address = '0x1234567890123456789012345678901234567890'
const originChainID = 10; // optimism
const spendingToken = RoutesService.getTokenAddress(originChainID, 'USDC');
const destinationChainID = 8453; // base
const receivingToken = RoutesService.getTokenAddress(destinationChainID, 'USDC');

const amount = BigInt(1000000);

const simpleIntentActionData: SimpleIntentActionData = {
  functionName: 'transfer',
  recipient: address,
}

const routesService = new RoutesService();

// create a simple stable transfer from my wallet on the origin chain to my wallet on the destination chain (bridge)
const intent = routesService.createSimpleIntent({
  creator: address,
  originChainID,
  spendingToken,
  destinationChainID,
  receivingToken,
  amount,
  simpleIntentActionData
})
```

### Request quotes for an intent and select a quote
To request quotes for an intent and select the cheapest quote, use the `OpenQuotingClient` and `selectCheapestQuote` functions.

Then, you can apply the quote by calling `applyQuoteToIntent` on the `RoutesService` instance.

``` ts
import { OpenQuotingClient, selectCheapestQuote } from '@eco-foundation/routes-sdk';

const quotes = await OpenQuotingClient.getQuotesForIntent(intent);
if (!quotes.length) {
  throw new Error('No quotes available');
}

// select quote
const selectedQuote = selectCheapestQuote(quotes);

// apply quote
const intentWithQuote = routesService.applyQuoteToIntent({ intent, quote: selectedQuote });
```

#### Custom selectors
Depending on your use case, you might want to select some quote based on some other criteria, not just the cheapest. You can create a custom selector function to do this.

``` ts
import { SolverQuote } from "@eco-foundation/routes-sdk";

// custom selector fn using SolverQuote type
export function selectMostExpensiveQuote(quotes: SolverQuote[]): SolverQuote {
  return quotes.reduce((mostExpensive, quote) => {
    const mostExpensiveSum = mostExpensive ? sum(mostExpensive.quoteData.tokens.map(({ balance }) => balance)) : BigInt(-1);
    const quoteSum = sum(quote.quoteData.tokens.map(({ balance }) => balance));
    return quoteSum > mostExpensiveSum ? quote : mostExpensive;
  });
}
```

### Publishing the intent
The SDK gives you what you need so that you can publish the intent to the origin chain with whatever web3 library you choose, here is an example of how to publish our quoted intent using `viem`!

``` ts
import { createWalletClient, privateKeyToAccount, webSocket, http, erc20Abi } from 'viem';
import { optimism } from 'viem/chains';
import { IntentSourceAbi } from '@eco-foundation/routes-ts';

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

try {
  const approveTxHash = await originWalletClient.writeContract({
    abi: erc20Abi,
    address: spendingToken,
    functionName: 'approve',
    args: [selectedQuote.intentSourceContract, amount],
    chain: originChain,
    account
  })

  await originPublicClient.waitForTransactionReceipt({ hash: approveTxHash })

  const publishTxHash = await originWalletClient.writeContract({
    abi: IntentSourceAbi,
    address: selectedQuote.intentSourceContract,
    functionName: 'publishIntent',
    args: [intentWithQuote, true],
    chain: originChain,
    account
  })

  await originPublicClient.waitForTransactionReceipt({ hash: publishTxHash })
}
catch (error) {
  console.error('Intent creation failed', error)
}
```

[See more from viem's docs](https://viem.sh/)

# Full examples

// FIXME: Add full examples and link here
For full examples of creating an intent and tracking it until it's fulfilled, see the [examples](./examples) directory.


# Testing

Create a `.env` file in the sdk directory and populate it with all the environment variables listed in [`.env.example`](./.env.example)

Run tests:
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
