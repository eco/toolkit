import { useState } from "react";
import { useConfig } from "../providers/config-provider";

type ContractType = "IntentSource" | "Inbox" | "HyperProver" | "MetaProver";

export default function EditConfig() {
  const config = useConfig();
  const [newChainId, setNewChainId] = useState("");

  const chains = config.customProtocolAddresses || {};

  function setQuotingClientUrl(value: string) {
    config.updateConfig({ openQuotingClientUrl: value })
  }

  function setPreprod(isPreprod: boolean) {
    config.updateConfig({ preprodContracts: isPreprod || undefined })
  }

  function addChain() {
    if (!newChainId.trim()) return;

    const updatedAddresses = {
      ...chains,
      [newChainId]: {}
    };
    config.updateConfig({ customProtocolAddresses: updatedAddresses });
    setNewChainId("");
  }

  function removeChain(chainId: string) {
    const updatedAddresses = { ...chains };
    delete updatedAddresses[chainId];
    const isEmpty = Object.keys(updatedAddresses).length === 0;
    config.updateConfig({ customProtocolAddresses: isEmpty ? undefined : updatedAddresses });
  }

  function updateContract(chainId: string, contractType: ContractType, address: string) {
    const updatedChain = {
      ...chains[chainId],
      [contractType]: address || undefined
    };
    
    const hasContracts = Object.values(updatedChain).some(addr => addr);
    const updatedAddresses = {
      ...chains,
      [chainId]: hasContracts ? updatedChain : {}
    };
    
    const isEmpty = Object.keys(updatedAddresses).length === 0 || 
                   Object.values(updatedAddresses).every(chain => Object.keys(chain).length === 0);
    config.updateConfig({ customProtocolAddresses: isEmpty ? undefined : updatedAddresses });
  }

  const routesServiceParams = config.preprodContracts || config.customProtocolAddresses ? JSON.stringify({ isPreprod: config.preprodContracts, customProtocolAddresses: config.customProtocolAddresses }, null, 2) : undefined;

  const openQuotingClientParams = JSON.stringify({
    dAppID: 'sdk-demo',
    customBaseUrl: config.openQuotingClientUrl === 'https://quotes.eco.com' ? undefined : config.openQuotingClientUrl,
  }, null, 2);

  return (
    <div className="m-4">
      <div className="w-full border-b-1 pb-4">
        <span className="text-2xl">Configure:</span>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <span>Preprod Contracts:</span>
              <input type="checkbox" defaultChecked={config.preprodContracts} onChange={(e) => setPreprod(e.target.checked)} />
            </div>
            <div className="flex gap-2">
              <span>Open Quoting URL:</span>
              <input type="text" className="border-1 w-[250px]" onChange={(e) => setQuotingClientUrl(e.target.value)} defaultValue={config.openQuotingClientUrl} />
            </div>
            <div className="flex flex-col gap-2">
              <span>Custom Protocol Addresses:</span>

              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Chain ID"
                  className="border-1 w-[120px]"
                  value={newChainId}
                  onChange={(e) => setNewChainId(e.target.value)}
                />
                <button
                  onClick={addChain}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Add Chain
                </button>
              </div>

              {Object.keys(chains).map((chainId) => (
                <div key={chainId} className="border p-3 rounded bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Chain ID: {chainId}</span>
                    <button
                      onClick={() => removeChain(chainId)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Remove Chain
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {(["IntentSource", "Inbox", "HyperProver", "MetaProver"] as ContractType[]).map((contractType) => (
                      <div key={contractType} className="flex gap-2 items-center">
                        <span className="w-[120px] text-sm">{contractType}:</span>
                        <input
                          type="text"
                          placeholder="Contract address"
                          className="border-1 flex-1 text-sm"
                          value={chains[chainId]?.[contractType] || ""}
                          onChange={(e) => updateContract(chainId, contractType, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="h-full relative">
            <pre className="h-full">
              const routesService = new RoutesService({routesServiceParams});<br />
              const openQuotingClient = new OpenQuotingClient({openQuotingClientParams});
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}