import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open, save } from "@tauri-apps/plugin-dialog";
import "./App.css";
import { NoticeBanner } from "./components/NoticeBanner";
import { ProviderSetupModal } from "./components/ProviderSetupModal";
import { TitleBar } from "./components/TitleBar";
import { OverviewSection } from "./sections/OverviewSection";
import { PipelineSection } from "./sections/PipelineSection";
import { ResultsSection } from "./sections/ResultsSection";
import { SettingsSection } from "./sections/SettingsSection";
import type {
  AppSection,
  AppSettings,
  Notice,
  ProgressEvent,
  ProviderId,
  ProviderModelList,
  ProviderProfile,
  ResultView,
  ScreenedCandidate,
  ScreeningResult,
} from "./types/app";
import {
  escapeCsv,
  getCandidateName,
  getProviderPreset,
  getRunState,
  getStatusTone,
  isProviderConfigured,
  requiresApiKey,
} from "./utils/candidates";
import { loadSettings, persistSettings } from "./utils/settings";

function App() {
  const appWindow = getCurrentWindow();
  const [activeSection, setActiveSection] = useState<AppSection>("pipeline");
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [inputDir, setInputDir] = useState("");
  const [instruction, setInstruction] = useState("");
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [progressStatus, setProgressStatus] = useState("Waiting to start");
  const [activeView, setActiveView] = useState<ResultView>("all");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [availableModelsByProvider, setAvailableModelsByProvider] = useState<Partial<Record<ProviderId, string[]>>>({});
  const [loadingModelsFor, setLoadingModelsFor] = useState<ProviderId | null>(null);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  const activeProvider = settings.providers[settings.activeProviderId];
  const activePreset = getProviderPreset(settings.activeProviderId);
  const activeProviderModels = availableModelsByProvider[settings.activeProviderId] ?? [];
  const providerConfigured = isProviderConfigured(settings.activeProviderId, activeProvider);

  useEffect(() => {
    persistSettings(settings);
  }, [settings]);

  useEffect(() => {
    let unlisten = () => {};

    listen<ProgressEvent>("screening-progress", (event) => {
      setProgress(event.payload);
      setProgressStatus(`${event.payload.file_name} | ${event.payload.status}`);
    }).then((cleanup) => {
      unlisten = cleanup;
    });

    return () => {
      unlisten();
    };
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setNotice(null);
    }, 4200);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    let unlistenResize = () => {};
    let unlistenFocus = () => {};

    appWindow.isMaximized().then(setIsMaximized).catch(() => {});
    appWindow.isFocused().then(setIsWindowFocused).catch(() => {});

    appWindow
      .onResized(async () => {
        try {
          setIsMaximized(await appWindow.isMaximized());
        } catch {
          // Ignore window state sync failures.
        }
      })
      .then((cleanup) => {
        unlistenResize = cleanup;
      });

    appWindow
      .onFocusChanged(({ payload }) => {
        setIsWindowFocused(payload);
      })
      .then((cleanup) => {
        unlistenFocus = cleanup;
      });

    return () => {
      unlistenResize();
      unlistenFocus();
    };
  }, [appWindow]);

  useEffect(() => {
    setModelLoadError(null);
  }, [settings.activeProviderId]);

  useEffect(() => {
    if (activeSection !== "settings") {
      return;
    }

    if (loadingModelsFor === settings.activeProviderId || activeProviderModels.length > 0) {
      return;
    }

    if (!activeProvider.baseUrl.trim()) {
      return;
    }

    if (requiresApiKey(settings.activeProviderId) && !activeProvider.apiKey.trim()) {
      return;
    }

    void loadProviderModels(settings.activeProviderId);
  }, [
    activeProvider.apiKey,
    activeProvider.baseUrl,
    activeProviderModels.length,
    activeSection,
    loadingModelsFor,
    settings.activeProviderId,
  ]);

  const resultBuckets = useMemo(
    () => ({
      all: result?.all_candidates ?? [],
      shortlist: result?.shortlisted_candidates ?? [],
      review: result?.review_candidates ?? [],
      weak: result?.weak_match_candidates ?? [],
    }),
    [result],
  );

  const activeCandidates = useMemo(() => resultBuckets[activeView], [activeView, resultBuckets]);
  const exportCandidates = useMemo(() => result?.shortlisted_candidates ?? [], [result]);

  const readinessSummary = useMemo(() => {
    const completed = [providerConfigured, Boolean(inputDir), Boolean(instruction.trim())].filter(Boolean).length;
    return `${completed}/3 ready`;
  }, [providerConfigured, inputDir, instruction]);

  function updateProvider(providerId: ProviderId, patch: Partial<ProviderProfile>) {
    setSettings((current) => ({
      ...current,
      providers: {
        ...current.providers,
        [providerId]: {
          ...current.providers[providerId],
          ...patch,
        },
      },
    }));
  }

  async function chooseFolder() {
    const folder = await open({
      directory: true,
      multiple: false,
    });

    if (typeof folder === "string") {
      setInputDir(folder);
      setNotice({
        tone: "info",
        message: "Candidate folder connected successfully.",
      });
    }
  }

  async function loadProviderModels(providerId: ProviderId) {
    const profile = settings.providers[providerId];
    const preset = getProviderPreset(providerId);

    if (!profile.baseUrl.trim()) {
      setModelLoadError("Add a base endpoint first, then load the available models.");
      return;
    }

    if ((preset.requiresApiKey ?? true) && !profile.apiKey.trim()) {
      setModelLoadError(`Add an API key for ${profile.label} before loading models.`);
      return;
    }

    setLoadingModelsFor(providerId);
    setModelLoadError(null);

    try {
      const response = await invoke<ProviderModelList>("fetch_provider_models", {
        provider: {
          id: providerId,
          label: profile.label,
          baseUrl: profile.baseUrl,
          model: profile.model,
          apiKey: profile.apiKey.trim(),
        },
      });

      setAvailableModelsByProvider((current) => ({
        ...current,
        [providerId]: response.models,
      }));

      if (response.models.length && !response.models.includes(profile.model)) {
        updateProvider(providerId, { model: response.models[0] });
      }

      setNotice({
        tone: "success",
        message: `${response.models.length} models loaded for ${profile.label}.`,
      });
    } catch (error) {
      console.error(error);
      setAvailableModelsByProvider((current) => ({
        ...current,
        [providerId]: [],
      }));
      setModelLoadError(String(error));
    } finally {
      setLoadingModelsFor(null);
    }
  }

  async function startScreening() {
    if (!inputDir) {
      setActiveSection("pipeline");
      setNotice({
        tone: "error",
        message: "Select a CV folder before starting the screening run.",
      });
      return;
    }

    if (!instruction.trim()) {
      setActiveSection("pipeline");
      setNotice({
        tone: "error",
        message: "Add hiring criteria so the assistant knows how to score candidates.",
      });
      return;
    }

    if (requiresApiKey(settings.activeProviderId) && !activeProvider.apiKey.trim()) {
      setActiveSection("settings");
      setShowProviderModal(true);
      setNotice({
        tone: "info",
        message: `Connect ${activeProvider.label} before starting the screening run.`,
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setProgress(null);
    setActiveView("all");
    setProgressStatus("Starting screening...");
    setNotice({
      tone: "info",
      message: `Screening run started with ${activeProvider.label}.`,
    });

    try {
      const response = await invoke<ScreeningResult>("screen_cvs", {
        inputDir,
        instruction,
        provider: {
          id: settings.activeProviderId,
          label: activeProvider.label,
          baseUrl: activeProvider.baseUrl,
          model: activeProvider.model,
          apiKey: activeProvider.apiKey.trim(),
        },
      });

      setResult(response);
      setActiveView("all");

      if (settings.autoOpenResults) {
        setActiveSection("results");
      }

      setNotice({
        tone: "success",
        message: `Screening completed. ${response.processed_cvs} CVs were processed successfully.`,
      });
    } catch (error) {
      console.error(error);
      setNotice({
        tone: "error",
        message: String(error),
      });
    } finally {
      setLoading(false);
    }
  }

  async function exportCsv() {
    if (!result || !exportCandidates.length) {
      setNotice({
        tone: "info",
        message: "There are no selected candidates to export yet.",
      });
      return;
    }

    const csv = [["name", "email"], ...exportCandidates.map((candidate) => [getCandidateName(candidate), candidate.profile?.email ?? ""])]
      .map((row) => row.map((value) => escapeCsv(value)).join(","))
      .join("\n");

    const defaultPath = settings.exportWithTimestamp
      ? `selected-candidate-contacts-${new Date().toISOString().slice(0, 10)}.csv`
      : "selected-candidate-contacts.csv";

    try {
      const filePath = await save({
        defaultPath,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });

      if (!filePath || typeof filePath !== "string") {
        return;
      }

      await invoke("export_csv", {
        filePath,
        csvContent: csv,
      });

      setNotice({
        tone: "success",
        message: `CSV exported successfully to ${filePath}.`,
      });
    } catch (error) {
      console.error(error);
      setNotice({
        tone: "error",
        message: `Failed to export CSV. ${String(error)}`,
      });
    }
  }

  async function previewCandidateCv(candidate: ScreenedCandidate) {
    try {
      await invoke("open_cv_file", {
        filePath: candidate.file_path,
      });
    } catch (error) {
      console.error(error);
      setNotice({
        tone: "error",
        message: `Could not open ${candidate.file_name}. ${String(error)}`,
      });
    }
  }

  async function revealCandidateCv(candidate: ScreenedCandidate) {
    try {
      await invoke("reveal_cv_file", {
        filePath: candidate.file_path,
      });
    } catch (error) {
      console.error(error);
      setNotice({
        tone: "error",
        message: `Could not reveal ${candidate.file_name}. ${String(error)}`,
      });
    }
  }

  function saveProviderSetup() {
    if (requiresApiKey(settings.activeProviderId) && !activeProvider.apiKey.trim()) {
      setNotice({
        tone: "error",
        message: `Enter an API key for ${activeProvider.label} before saving.`,
      });
      return;
    }

    if (!activeProvider.baseUrl.trim() || !activeProvider.model.trim()) {
      setNotice({
        tone: "error",
        message: "Provider endpoint and model are both required.",
      });
      return;
    }

    setShowProviderModal(false);
    setNotice({
      tone: "success",
      message: `${activeProvider.label} has been configured successfully.`,
    });
  }

  const runState = getRunState(loading, result);
  const providerConnected = providerConfigured;

  async function handleMinimize() {
    try {
      await appWindow.minimize();
    } catch (error) {
      console.error(error);
      setNotice({
        tone: "error",
        message: `Could not minimize the window. ${String(error)}`,
      });
    }
  }

  async function handleToggleMaximize() {
    try {
      await appWindow.toggleMaximize();
      setIsMaximized(await appWindow.isMaximized());
    } catch (error) {
      console.error(error);
      setNotice({
        tone: "error",
        message: `Could not change the window size. ${String(error)}`,
      });
    }
  }

  async function handleClose() {
    try {
      await appWindow.close();
    } catch (error) {
      console.error(error);
      setNotice({
        tone: "error",
        message: `Could not close the window. ${String(error)}`,
      });
    }
  }

  return (
    <div className={`window-shell ${isWindowFocused ? "window-focused" : "window-blurred"}`}>
      <TitleBar
        isMaximized={isMaximized}
        onMinimize={() => void handleMinimize()}
        onToggleMaximize={() => void handleToggleMaximize()}
        onClose={() => void handleClose()}
      />

      <div className="window-content-scroll">
        <main className="app-shell">
          <header className="app-header">
            <div className="brand-row">
              <div className="brand-mark" aria-hidden="true">
                <img src="/talentiq-icon.svg" alt="" className="brand-mark-image" />
              </div>

              <div>
                <p className="eyebrow">Talent Intelligence Suite</p>
                <h1>TalentIQ Desktop</h1>
                <p className="subtitle">A simpler screening workspace for selecting, reviewing, and exporting candidates.</p>
              </div>
            </div>

            <div className="header-actions">
              <button className="secondary-button" onClick={() => setActiveSection("settings")}>
                Settings
              </button>
              <button className="primary-button" onClick={startScreening} disabled={loading}>
                {loading ? "Screening..." : "Start Screening"}
              </button>
            </div>
          </header>

          <section className="tab-bar" aria-label="Primary navigation">
            {[
              ["overview", "Overview"],
              ["pipeline", "Pipeline"],
              ["results", "Results"],
              ["settings", "Settings"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`tab-button ${activeSection === key ? "tab-button-active" : ""}`}
                onClick={() => setActiveSection(key as AppSection)}
              >
                {label}
              </button>
            ))}
          </section>

          {notice && <NoticeBanner notice={notice} />}

          {activeSection === "overview" && (
            <OverviewSection
              activeProvider={activeProvider}
              inputDir={inputDir}
              instruction={instruction}
              providerConnected={providerConnected}
              readinessSummary={readinessSummary}
              result={result}
              runState={runState}
              onOpenPipeline={() => setActiveSection("pipeline")}
              onOpenResults={() => setActiveSection("results")}
              onOpenSettings={() => setActiveSection("settings")}
            />
          )}

          {activeSection === "pipeline" && (
            <PipelineSection
              activeProvider={activeProvider}
              inputDir={inputDir}
              instruction={instruction}
              loading={loading}
              progress={progress}
              progressStatus={progressStatus}
              runState={runState}
              getStatusTone={getStatusTone}
              onChooseFolder={() => void chooseFolder()}
              onInstructionChange={setInstruction}
              onStartScreening={() => void startScreening()}
              onOpenSettings={() => setActiveSection("settings")}
              onExportCsv={() => void exportCsv()}
              canExport={Boolean(result)}
            />
          )}

          {activeSection === "results" && (
            <ResultsSection
              activeCandidates={activeCandidates}
              activeView={activeView}
              onPreview={(candidate) => void previewCandidateCv(candidate)}
              onReveal={(candidate) => void revealCandidateCv(candidate)}
              onViewChange={setActiveView}
              result={result}
              resultBuckets={resultBuckets}
            />
          )}

          {activeSection === "settings" && (
            <SettingsSection
              activePresetLabel={activePreset.label}
              activeProvider={activeProvider}
              activeProviderId={settings.activeProviderId}
              activeProviderModels={activeProviderModels}
              loadingModelsFor={loadingModelsFor}
              modelLoadError={modelLoadError}
              onActiveProviderChange={(providerId) => setSettings((current) => ({ ...current, activeProviderId: providerId }))}
              onLoadModels={() => void loadProviderModels(settings.activeProviderId)}
              onSettingsChange={(updater) => setSettings(updater)}
              onUpdateProvider={updateProvider}
              settings={settings}
            />
          )}

          {showProviderModal && (
            <ProviderSetupModal
              activeProvider={activeProvider}
              activeProviderId={settings.activeProviderId}
              onClose={() => setShowProviderModal(false)}
              onOpenSettings={() => setActiveSection("settings")}
              onSave={saveProviderSetup}
              onUpdateProvider={updateProvider}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
