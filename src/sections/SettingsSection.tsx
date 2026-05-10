import { providerPresets } from "../config/providers";
import type { AppSettings, ProviderId, ProviderProfile } from "../types/app";
import { isProviderConfigured, requiresApiKey } from "../utils/candidates";

type SettingsSectionProps = {
  activePresetLabel: string;
  activeProvider: ProviderProfile;
  activeProviderId: ProviderId;
  activeProviderModels: string[];
  loadingModelsFor: ProviderId | null;
  modelLoadError: string | null;
  onActiveProviderChange: (providerId: ProviderId) => void;
  onLoadModels: () => void;
  onSettingsChange: (updater: (current: AppSettings) => AppSettings) => void;
  onUpdateProvider: (providerId: ProviderId, patch: Partial<ProviderProfile>) => void;
  settings: AppSettings;
};

export function SettingsSection({
  activePresetLabel,
  activeProvider,
  activeProviderId,
  activeProviderModels,
  loadingModelsFor,
  modelLoadError,
  onActiveProviderChange,
  onLoadModels,
  onSettingsChange,
  onUpdateProvider,
  settings,
}: SettingsSectionProps) {
  return (
    <section className="two-column-layout">
      <section className="surface">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Providers</p>
            <h2>Choose a screening provider</h2>
          </div>
        </div>

        <div className="provider-grid">
          {providerPresets.map((preset) => {
            const profile = settings.providers[preset.id];
            const isActive = settings.activeProviderId === preset.id;
            const isConfigured = isProviderConfigured(preset.id, profile);

            return (
              <button
                key={preset.id}
                type="button"
                className={`provider-card ${isActive ? "provider-card-active" : ""}`}
                onClick={() => onActiveProviderChange(preset.id)}
              >
                <div className="provider-card-top">
                  <strong>{profile.label}</strong>
                  <span>{isConfigured ? "Ready" : "Needs setup"}</span>
                </div>
                <p>{preset.category}</p>
                <small>{preset.description}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="surface">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Configuration</p>
            <h2>{activeProvider.label}</h2>
          </div>
        </div>

        <div className="settings-form">
          <label className="field-label" htmlFor="provider-label">
            Display name
          </label>
          <input
            id="provider-label"
            className="text-input"
            value={activeProvider.label}
            onChange={(event) => onUpdateProvider(activeProviderId, { label: event.target.value })}
            placeholder="Provider display name"
          />

          <label className="field-label" htmlFor="provider-endpoint">
            Base endpoint
          </label>
          <input
            id="provider-endpoint"
            className="text-input"
            value={activeProvider.baseUrl}
            onChange={(event) => onUpdateProvider(activeProviderId, { baseUrl: event.target.value })}
            placeholder="https://api.example.com/v1"
          />

          <label className="field-label" htmlFor="provider-model">
            Model
          </label>
          {activeProviderModels.length > 0 && (
            <select
              id="provider-model"
              className="text-input"
              value={activeProviderModels.includes(activeProvider.model) ? activeProvider.model : ""}
              onChange={(event) => onUpdateProvider(activeProviderId, { model: event.target.value })}
            >
              {!activeProviderModels.includes(activeProvider.model) && <option value="">Choose a discovered model</option>}
              {activeProviderModels.map((modelName) => (
                <option key={modelName} value={modelName}>
                  {modelName}
                </option>
              ))}
            </select>
          )}
          <input
            id={activeProviderModels.length > 0 ? "provider-model-manual" : "provider-model"}
            className="text-input"
            value={activeProvider.model}
            onChange={(event) => onUpdateProvider(activeProviderId, { model: event.target.value })}
            placeholder="model-name"
          />
          <div className="simple-row">
            <span>Model discovery</span>
            <button type="button" className="secondary-button" onClick={onLoadModels} disabled={loadingModelsFor === activeProviderId}>
              {loadingModelsFor === activeProviderId ? "Loading models..." : `Load ${activePresetLabel} Models`}
            </button>
          </div>
          <p className="config-copy">
            {activeProviderModels.length
              ? `${activeProviderModels.length} models found. Choose one from the list or type a custom model manually.`
              : "Load the provider's available models after entering the endpoint and API key."}
          </p>
          {modelLoadError && <p className="path-display">{modelLoadError}</p>}

          {requiresApiKey(activeProviderId) ? (
            <>
              <label className="field-label" htmlFor="provider-api-key">
                API key
              </label>
              <input
                id="provider-api-key"
                className="text-input"
                type="password"
                value={activeProvider.apiKey}
                onChange={(event) => onUpdateProvider(activeProviderId, { apiKey: event.target.value })}
                placeholder="Paste your API key"
              />
            </>
          ) : (
            <p className="config-copy">This provider can work without an API key.</p>
          )}

          {requiresApiKey(activeProviderId) && (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={activeProvider.rememberKey}
                onChange={(event) => onUpdateProvider(activeProviderId, { rememberKey: event.target.checked })}
              />
              <span>Remember this key on this device</span>
            </label>
          )}

          <div className="settings-toggles">
            <label className="toggle-card">
              <div>
                <strong>Open results after each run</strong>
                <p>Automatically switch to the results tab when screening completes.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoOpenResults}
                onChange={(event) => onSettingsChange((current) => ({ ...current, autoOpenResults: event.target.checked }))}
              />
            </label>

            <label className="toggle-card">
              <div>
                <strong>Timestamp exported CSV files</strong>
                <p>Use dated file names when exporting results.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.exportWithTimestamp}
                onChange={(event) => onSettingsChange((current) => ({ ...current, exportWithTimestamp: event.target.checked }))}
              />
            </label>
          </div>
        </div>
      </section>
    </section>
  );
}
