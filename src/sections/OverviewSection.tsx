import { ResultCount } from "../components/ResultCount";
import type { ProviderProfile, ScreeningResult } from "../types/app";

type OverviewSectionProps = {
  activeProvider: ProviderProfile;
  inputDir: string;
  instruction: string;
  providerConnected: boolean;
  readinessSummary: string;
  result: ScreeningResult | null;
  runState: string;
  onOpenPipeline: () => void;
  onOpenResults: () => void;
  onOpenSettings: () => void;
};

export function OverviewSection({
  activeProvider,
  inputDir,
  instruction,
  providerConnected,
  readinessSummary,
  result,
  runState,
  onOpenPipeline,
  onOpenResults,
  onOpenSettings,
}: OverviewSectionProps) {
  return (
    <section className="content-grid">
      <section className="surface hero-panel">
        <div className="overview-hero-layout">
          <div>
            <p className="eyebrow">Overview</p>
            <h2>Run the entire screening workflow from one calm control panel.</h2>
            <p>
              Connect your provider, choose the resume folder, define the hiring rule, then review shortlisted candidates and
              export only the selected ones.
            </p>

            <div className="hero-inline-stats">
              <span>{activeProvider.label}</span>
              <span>{runState}</span>
              <span>{readinessSummary}</span>
            </div>
          </div>

          <div className="overview-hero-card">
            <span className="simple-label">Current workspace</span>
            <strong>{instruction.trim() ? "Ready for screening" : "Needs setup"}</strong>
            <p>
              {instruction.trim()
                ? "Your provider, source folder, and screening rule can now be used to run a candidate review."
                : "Finish the three setup steps below before you run the first screening."}
            </p>
          </div>
        </div>
      </section>

      <section className="metric-grid">
        <ResultCount label="Total CVs" value={result?.total_cvs ?? 0} />
        <ResultCount label="Processed" value={result?.processed_cvs ?? 0} />
        <ResultCount label="Shortlist" value={result?.shortlist_count ?? 0} tone="success" />
        <ResultCount label="HR Review" value={result?.review_count ?? 0} tone="warning" />
        <ResultCount label="Weak Match" value={result?.weak_match_count ?? 0} tone="danger" />
      </section>

      <section className="surface overview-main-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Setup checklist</p>
            <h2>Prepare the next screening run</h2>
          </div>
        </div>

        <div className="overview-checklist">
          <div className={`checklist-item ${providerConnected ? "checklist-item-done" : ""}`}>
            <div className="checklist-marker">{providerConnected ? "1" : "1"}</div>
            <div>
              <strong>Provider connected</strong>
              <p>{providerConnected ? `${activeProvider.label} is configured and ready.` : "Add an API key in Settings to enable screening."}</p>
            </div>
          </div>

          <div className={`checklist-item ${inputDir ? "checklist-item-done" : ""}`}>
            <div className="checklist-marker">2</div>
            <div>
              <strong>Candidate folder selected</strong>
              <p>{inputDir || "Choose the folder that contains the PDF resumes."}</p>
            </div>
          </div>

          <div className={`checklist-item ${instruction.trim() ? "checklist-item-done" : ""}`}>
            <div className="checklist-marker">3</div>
            <div>
              <strong>Screening rule written</strong>
              <p>
                {instruction.trim()
                  ? `${instruction.trim().slice(0, 135)}${instruction.trim().length > 135 ? "..." : ""}`
                  : "Write a clear instruction such as the exact experience or skills required."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="surface compact-grid overview-side-grid">
        <div className="simple-card">
          <span className="simple-label">Quick action</span>
          <strong>Go to pipeline</strong>
          <p>Open the main workspace to choose the folder and write the screening criteria.</p>
          <button className="secondary-button inline-action-button" onClick={onOpenPipeline}>
            Open Pipeline
          </button>
        </div>

        <div className="simple-card">
          <span className="simple-label">Quick action</span>
          <strong>Review results</strong>
          <p>Inspect shortlisted candidates, manual review cases, and weak matches.</p>
          <button className="secondary-button inline-action-button" onClick={onOpenResults}>
            Open Results
          </button>
        </div>

        <div className="simple-card">
          <span className="simple-label">Quick action</span>
          <strong>Manage provider</strong>
          <p>Switch models, update API keys, or change export preferences from Settings.</p>
          <button className="secondary-button inline-action-button" onClick={onOpenSettings}>
            Open Settings
          </button>
        </div>
      </section>
    </section>
  );
}
