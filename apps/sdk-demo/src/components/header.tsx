import { ConnectButton } from "@rainbow-me/rainbowkit"

export default function Header() {
  return (
    <div className="p-4 flex items-center justify-end gap-2">
      <span className='text-3xl mr-auto'>Eco Routes SDK Demo</span>
      <ConnectButton showBalance={false} label="Connect Wallet" />
    </div>
  )
}
