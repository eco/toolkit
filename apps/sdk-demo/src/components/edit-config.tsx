import { useConfig } from "../providers/config-provider";


export default function EditConfig() {

  const config = useConfig();

  function setQuotingClientUrl(value: string) {
    config.updateConfig({ openQuotingClientUrl: value })
  }

  function setPreprod(isPreprod: boolean) {
    config.updateConfig({ preprodContracts: isPreprod })
  }
  return (
    <div className="w-full border-b-1 p-4">
      <span className="text-2xl">Edit Config</span>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <span>Open Quoting URL:</span>
          <input type="text" className="border-1 w-[250px]" onChange={(e) => setQuotingClientUrl(e.target.value)} defaultValue={config.openQuotingClientUrl} />
        </div>
        <div className="flex gap-2">
          <span>Preprod Contracts:</span>
          <input type="checkbox" defaultChecked={config.preprodContracts} onChange={(e) => setPreprod(e.target.checked)} />
        </div>
      </div>
    </div>
  );
}