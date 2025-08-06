import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { EcoChains } from '@eco-foundation/chains';

if (!process.env.NEXT_PUBLIC_WALLET_CONNECT_ID) {
  throw new Error('NEXT_PUBLIC_WALLET_CONNECT_ID is required');
}

export const ecoChains = new EcoChains({
  alchemyKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  infuraKey: process.env.NEXT_PUBLIC_INFURA_API_KEY
})
export const chains = ecoChains.getAllChains();

export const config = getDefaultConfig({
  appName: 'Eco Routes SDK Demo',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID,
  chains,
  ssr: true,
  transports: ecoChains.getTransports(chains)
});