import { PropsWithChildren, useContext, useState, createContext } from "react";

type Config = {
  openQuotingClientUrl?: string
  preprodContracts?: boolean
}

export const defaultConfig: Config = {
  openQuotingClientUrl: "https://quotes-preprod.eco.com",
  preprodContracts: true
}

const ConfigContext = createContext({
  updateConfig: (newConfig: Partial<Config>) => { },
  ...defaultConfig
})

export default function ConfigProvider({ children }: PropsWithChildren) {

  const [config, setConfig] = useState<Config>(defaultConfig)

  function updateConfig(newConfig: Partial<Config>) {
    setConfig({
      ...config, ...newConfig
    })
  }

  return (
    <ConfigContext.Provider value={{
      updateConfig,
      ...config
    }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  return useContext(ConfigContext)
}