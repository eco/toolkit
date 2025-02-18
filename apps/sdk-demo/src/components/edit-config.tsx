import { useConfig } from "../providers/config-provider";

export default function EditConfig() {
  const config = useConfig();

  function setQuotingClientUrl(value: string) {
    config.updateConfig({ openQuotingClientUrl: value })
  }

  function setPreprod(isPreprod: boolean) {
    config.updateConfig({ preprodContracts: isPreprod })
  }

  const routesServiceParams = config.preprodContracts ? JSON.stringify({ isPreprod: config.preprodContracts }, null, 2) : undefined;

  const openQuotingClientParams = JSON.stringify({
    dAppID: 'sdk-demo',
    customBaseUrl: config.openQuotingClientUrl === 'https://quotes.eco.com' ? undefined : config.openQuotingClientUrl,
  }, null, 2);

  return (
    <div className="m-4">
      <div className="w-full border-b-1 pb-4">
        <span className="text-2xl">Edit Config</span>
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