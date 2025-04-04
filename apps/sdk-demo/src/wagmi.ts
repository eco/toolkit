import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  optimism,
  unichain,
  polygon,
  // abstract,
  // mantle,
  base,
  arbitrum,
  celo
} from 'wagmi/chains';
import { http } from 'wagmi';

if (!process.env.NEXT_PUBLIC_WALLET_CONNECT_ID) {
  throw new Error('NEXT_PUBLIC_WALLET_CONNECT_ID is required');
}

export const config = getDefaultConfig({
  appName: 'Eco Routes SDK Demo',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID,
  chains: [
    mainnet,
    optimism,
    unichain,
    polygon,
    // abstract,
    // mantle,
    base,
    arbitrum,
    celo,
  ],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL),
    [optimism.id]: http(process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL),
    [unichain.id]: http(process.env.NEXT_PUBLIC_UNICHAIN_RPC_URL),
    [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL),
    // [abstract.id]: http(process.env.NEXT_PUBLIC_ABSTRACT_RPC_URL),
    // [mantle.id]: http(process.env.NEXT_PUBLIC_MANTLE_RPC_URL),
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL),
    [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC_URL),
  },
  ssr: true,
});