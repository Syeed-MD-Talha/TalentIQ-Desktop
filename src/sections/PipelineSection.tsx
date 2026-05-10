import type { ProgressEvent, ProviderProfile } from "../types/app";

type PipelineSectionProps = {
  activeProvider: ProviderProfile;
  inputDir: string;
  instruction: string;
  loading: boolean;
  progress: ProgressEvent | null;
  progressStatus: string;
  runState: string;
  getStatusTone: (status: string) => string;
  onChooseFolder: () => void;
  onInstructionChange: (value: string) => void;
  onStartScreening: () => void;
  onOpenSettings: () => void;
  onExportCsv: () => void;
  canExport: boolean;
};

export function PipelineSection({
  activeProvider,
  inputDir,
  instruction,
  loading,
  progress,
  progressStatus,
  runState,
  getStatusTone,
  onChooseFolder,
  onInstructionChange,
  onStartScreening,
  onOpenSettings,
  onExportCsv,
  canExport,
}: PipelineSectionProps) {
  return (
    <section className="two-column-layout">
      <section className="surface">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Setup</p>
            <h2>Build the screening run</h2>
          </div>
        </div>

        <div className="stack">
          <div className="config-card">
            <div className="config-topline">
              <strong>Candidate folder</strong>
              <span className={getStatusTone(inputDir ? "Connected" : "Required")}>{inputDir ? "Connected" : "Required"}</span>
            </div>
            <p className="config-copy">Select the folder that contains the PDF resumes you want to evaluate.</p>
            <button className="secondary-button" onClick={onChooseFolder}>
              Choose CV Folder
            </button>
            <p className="path-display">{inputDir || "No folder selected yet."}</p>
          </div>

          <div className="config-card">
            <div className="config-topline">
              <strong>Hiring criteria</strong>
              <span className={getStatusTone(instruction.trim() ? "Ready" : "Required")}>{instruction.trim() ? "Ready" : "Required"}</span>
            </div>
            <p className="config-copy">Describe the exact rules for selection, rejection, or manual review.</p>
            <textarea
              className="prompt-textarea"
              value={instruction}
              onChange={(event) => onInstructionChange(event.target.value)}
              placeholder="Example: choose only candidates who have industry job experience in software development."
            />
          </div>
        </div>
      </section>

      <aside className="side-stack">
        <section className="surface">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Run control</p>
              <h2>Current run</h2>
            </div>
          </div>

          <div className="stack">
            <div className="simple-row">
              <span>Provider</span>
              <strong>{activeProvider.label}</strong>
            </div>
            <div className="simple-row">
              <span>Model</span>
              <strong>{activeProvider.model}</strong>
            </div>
            <div className="simple-row">
              <span>Status</span>
              <strong>{runState}</strong>
            </div>
            <div className="simple-row">
              <span>Progress</span>
              <strong>{progress ? `${progress.processed}/${progress.total}` : "Not started"}</strong>
            </div>
          </div>

          <div className="button-stack">
            <button className="primary-button" onClick={onStartScreening} disabled={loading}>
              {loading ? "Screening..." : "Start Screening"}
            </button>
            <button className="secondary-button" onClick={onOpenSettings}>
              Open Settings
            </button>
            <button className="secondary-button" onClick={onExportCsv} disabled={!canExport}>
              Export Selected CSV
            </button>
          </div>
        </section>

        <section className="surface">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Progress</p>
              <h2>Live activity</h2>
            </div>
          </div>

          <p className="progress-copy">{progressStatus}</p>
          <div className="progress-track" aria-hidden="true">
            <div
              className="progress-bar"
              style={{
                width: progress ? `${Math.max(6, (progress.processed / progress.total) * 100)}%` : loading ? "12%" : "0%",
              }}
            />
          </div>
        </section>
      </aside>
    </section>
  );
}
