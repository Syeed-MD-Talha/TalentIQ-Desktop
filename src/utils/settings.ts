import { APP_SETTINGS_KEY, providerPresets } from "../config/providers";
import type { AppSettings, ProviderId, ProviderProfile } from "../types/app";

export function buildDefaultSettings(): AppSettings {
  return {
    activeProviderId: "groq",
    providers: Object.fromEntries(
      providerPresets.map((preset) => [
        preset.id,
        {
          label: preset.label,
          baseUrl: preset.baseUrl,
          model: preset.defaultModel,
          apiKey: "",
          rememberKey: preset.id !== "custom",
        },
      ]),
    ) as Record<ProviderId, ProviderProfile>,
    autoOpenResults: true,
    exportWithTimestamp: true,
  };
}

export function loadSettings(): AppSettings {
  const defaults = buildDefaultSettings();
  const raw = window.localStorage.getItem(APP_SETTINGS_KEY);

  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const mergedProviders = { ...defaults.providers };

    for (const preset of providerPresets) {
      const incoming = parsed.providers?.[preset.id];
      if (incoming) {
        mergedProviders[preset.id] = {
          ...mergedProviders[preset.id],
          ...incoming,
        };
      }
    }

    return {
      activeProviderId: parsed.activeProviderId ?? defaults.activeProviderId,
      providers: mergedProviders,
      autoOpenResults: parsed.autoOpenResults ?? defaults.autoOpenResults,
      exportWithTimestamp: parsed.exportWithTimestamp ?? defaults.exportWithTimestamp,
    };
  } catch {
    return defaults;
  }
}

export function persistSettings(settings: AppSettings) {
  const sanitizedProviders = Object.fromEntries(
    Object.entries(settings.providers).map(([id, profile]) => [
      id,
      profile.rememberKey ? profile : { ...profile, apiKey: "" },
    ]),
  );

  window.localStorage.setItem(
    APP_SETTINGS_KEY,
    JSON.stringify({
      ...settings,
      providers: sanitizedProviders,
    }),
  );
}
