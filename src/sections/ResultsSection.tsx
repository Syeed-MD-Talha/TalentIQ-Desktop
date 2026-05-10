import { CandidateRow } from "../components/CandidateRow";
import { ResultCount } from "../components/ResultCount";
import type { ResultView, ScreenedCandidate, ScreeningResult } from "../types/app";

type ResultsSectionProps = {
  activeCandidates: ScreenedCandidate[];
  activeView: ResultView;
  onPreview: (candidate: ScreenedCandidate) => void;
  onReveal: (candidate: ScreenedCandidate) => void;
  onViewChange: (view: ResultView) => void;
  result: ScreeningResult | null;
  resultBuckets: Record<ResultView, ScreenedCandidate[]>;
};

export function ResultsSection({
  activeCandidates,
  activeView,
  onPreview,
  onReveal,
  onViewChange,
  result,
  resultBuckets,
}: ResultsSectionProps) {
  return (
    <section className="stack-large">
      <section className="metric-grid">
        <ResultCount label="Total CVs" value={result?.total_cvs ?? 0} />
        <ResultCount label="Processed" value={result?.processed_cvs ?? 0} />
        <ResultCount label="Shortlist" value={result?.shortlist_count ?? 0} tone="success" />
        <ResultCount label="HR Review" value={result?.review_count ?? 0} tone="warning" />
        <ResultCount label="Weak Match" value={result?.weak_match_count ?? 0} tone="danger" />
      </section>

      <section className="surface">
        <div className="results-toolbar">
          <div>
            <p className="eyebrow">Candidate explorer</p>
            <h2>Review results</h2>
          </div>

          <div className="filter-row">
            {([
              ["all", "All", resultBuckets.all.length],
              ["shortlist", "Shortlist", resultBuckets.shortlist.length],
              ["review", "HR Review", resultBuckets.review.length],
              ["weak", "Weak Match", resultBuckets.weak.length],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                className={`filter-chip ${activeView === key ? "filter-chip-active" : ""}`}
                onClick={() => onViewChange(key)}
              >
                <span>{label}</span>
                <strong>{count}</strong>
              </button>
            ))}
          </div>
        </div>

        {activeCandidates.length ? (
          <div className="candidate-list">
            {activeCandidates.map((candidate, index) => (
              <CandidateRow
                key={`${candidate.file_name}-${candidate.score}-${index}`}
                candidate={candidate}
                onPreview={onPreview}
                onReveal={onReveal}
              />
            ))}
          </div>
        ) : (
          <div className="empty-shell">
            <h3>No candidates to show yet</h3>
            <p>Run the screening pipeline first, then come back here to review the output.</p>
          </div>
        )}
      </section>
    </section>
  );
}
