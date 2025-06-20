import { ProtocolAddresses } from "@eco-foundation/routes-sdk";
import { PropsWithChildren, useContext, useState, createContext } from "react";

type Config = {
  updateConfig: (newConfig: Partial<Config>) => void
  openQuotingClientUrl?: string
  preprodContracts?: boolean
  customProtocolAddresses?: ProtocolAddresses
}

export const defaultConfig: Config = {
  updateConfig: () => { },
  openQuotingClientUrl: "https://quotes.eco.com",
  preprodContracts: false,
  customProtocolAddresses: undefined,
}

const ConfigContext = createContext(defaultConfig)

export default function ConfigProvider({ children }: PropsWithChildren) {
  const [config, setConfig] = useState<Config>(defaultConfig)
  function updateConfig(newConfig: Partial<Config>) {
    setConfig({
      ...config, ...newConfig
    })
  }

  return (
    <ConfigContext.Provider value={{
      ...config,
      updateConfig,
    }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  return useContext(ConfigContext)
}