import { useState } from 'react';
import { KeyValueDisplay } from '@/app/components/keyvalue-display';
import TwoPanel from '@/app/components/two-panel';
import { Window } from '@/app/components/window';
import { WindowInfoPanel } from '@/app/components/window-info-panel';
import { WindowList } from '@/app/components/window-list';
import useLLMEndpointList from '@views/moonshot-desktop/hooks/useLLMEndpointList';

type FileExplorerEndpointsProps = {
  windowId: string;
  initialXY: [number, number];
  initialSize: [number, number];
  zIndex: number | 'auto';
  onCloseClick: () => void;
  onWindowChange?: (
    x: number,
    y: number,
    width: number,
    height: number,
    scrollTop: number,
    windowId: string
  ) => void;
};

function FileExplorerEndpoints(props: FileExplorerEndpointsProps) {
  const {
    windowId,
    onCloseClick,
    initialXY = [600, 200],
    initialSize = [720, 470],
    zIndex,
    onWindowChange,
  } = props;
  const { llmEndpoints, error, isLoading } = useLLMEndpointList();
  const [selectedEndpoint, setSelectedEndpoint] = useState<LLMEndpoint>();

  function handleListItemClick(name: string) {
    const endpoint = llmEndpoints.find((epoint) => epoint.name === name);
    if (endpoint) {
      setSelectedEndpoint(endpoint);
    }
  }

  return isLoading ? null : (
    <Window
      id={windowId}
      resizeable
      initialXY={initialXY}
      zIndex={zIndex}
      initialWindowSize={initialSize}
      onCloseClick={onCloseClick}
      onWindowChange={onWindowChange}
      name="LLM Endpoints"
      leftFooterText={
        llmEndpoints.length
          ? `${llmEndpoints.length} Endpoint${llmEndpoints.length > 1 ? 's' : ''}`
          : ''
      }>
      {selectedEndpoint ? (
        <TwoPanel>
          <WindowList>
            {llmEndpoints
              ? llmEndpoints.map((endpoint) => (
                  <WindowList.Item
                    key={endpoint.name}
                    displayName={endpoint.name}
                    id={endpoint.name}
                    onClick={() => handleListItemClick(endpoint.name)}
                    selected={selectedEndpoint.name === endpoint.name}
                  />
                ))
              : null}
          </WindowList>
          <WindowInfoPanel title="LLM Endpoint">
            <div className="h-full">
              {selectedEndpoint ? (
                <div className="flex flex-col gap-6">
                  <div>
                    <KeyValueDisplay
                      label="Endpoint Name"
                      value={selectedEndpoint.name}
                    />
                    <KeyValueDisplay
                      label="Type"
                      value={selectedEndpoint.type}
                    />
                    <KeyValueDisplay
                      label="URI"
                      value={selectedEndpoint.uri}
                    />
                    <KeyValueDisplay
                      label="Max Calls / second"
                      value={selectedEndpoint.max_calls_per_second.toString()}
                    />
                    <KeyValueDisplay
                      label="Max Concurrency"
                      value={selectedEndpoint.max_concurrency.toString()}
                    />
                    <KeyValueDisplay
                      label="API Token"
                      value={
                        selectedEndpoint.token.substring(
                          0,
                          Math.ceil(selectedEndpoint.token.length / 2)
                        ) +
                        '*'.repeat(
                          Math.floor(selectedEndpoint.token.length / 2)
                        )
                      }
                    />
                  </div>
                  <div>
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={() => null}>
                      Edit
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </WindowInfoPanel>
        </TwoPanel>
      ) : (
        <WindowList>
          {llmEndpoints
            ? llmEndpoints.map((endpoint) => (
                <WindowList.Item
                  key={endpoint.name}
                  displayName={endpoint.name}
                  id={endpoint.name}
                  onClick={handleListItemClick}
                />
              ))
            : null}
        </WindowList>
      )}
    </Window>
  );
}

export { FileExplorerEndpoints };