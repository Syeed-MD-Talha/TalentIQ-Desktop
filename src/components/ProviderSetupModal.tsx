import type { ProviderId, ProviderProfile } from "../types/app";
import { requiresApiKey } from "../utils/candidates";

type ProviderSetupModalProps = {
  activeProvider: ProviderProfile;
  activeProviderId: ProviderId;
  onClose: () => void;
  onOpenSettings: () => void;
  onSave: () => void;
  onUpdateProvider: (providerId: ProviderId, patch: Partial<ProviderProfile>) => void;
};

export function ProviderSetupModal({
  activeProvider,
  activeProviderId,
  onClose,
  onOpenSettings,
  onSave,
  onUpdateProvider,
}: ProviderSetupModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="provider-modal-title">
        <p className="eyebrow">Secure configuration</p>
        <h2 id="provider-modal-title">Connect your screening provider</h2>
        <p className="modal-copy">
          {requiresApiKey(activeProviderId)
            ? "Add an API key to start screening with the selected provider."
            : "Review the provider settings and save when everything looks ready."}
        </p>

        {requiresApiKey(activeProviderId) && (
          <>
            <label className="field-label" htmlFor="modal-api-key">
              {activeProvider.label} API key
            </label>
            <input
              id="modal-api-key"
              className="text-input"
              type="password"
              value={activeProvider.apiKey}
              onChange={(event) => onUpdateProvider(activeProviderId, { apiKey: event.target.value })}
              placeholder="Paste your API key"
              autoComplete="off"
              autoFocus
            />

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={activeProvider.rememberKey}
                onChange={(event) => onUpdateProvider(activeProviderId, { rememberKey: event.target.checked })}
              />
              <span>Remember this key on this device</span>
            </label>
          </>
        )}

        <div className="modal-actions">
          <button className="ghost-button" onClick={onClose}>
            Close
          </button>
          <button className="secondary-button" onClick={onOpenSettings}>
            Full Settings
          </button>
          <button className="primary-button" onClick={onSave}>
            Save Provider
          </button>
        </div>
      </div>
    </div>
  );
}
