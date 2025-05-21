import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { EcoChains } from '@eco-foundation/chains';

if (!process.env.NEXT_PUBLIC_WALLET_CONNECT_ID) {
  throw new Error('NEXT_PUBLIC_WALLET_CONNECT_ID is required');
}

export const chains = new EcoChains({ alchemyKey: 'ciY4Y9dupusstsVULn-8kI5jQHbAbLMG' }).getAllChains();

export const config = getDefaultConfig({
  appName: 'Eco Routes SDK Demo',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID,
  chains,
  ssr: true,
});
