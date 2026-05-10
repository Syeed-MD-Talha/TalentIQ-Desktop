import type { ScreenedCandidate } from "../types/app";
import {
  getCandidateDepartment,
  getCandidateName,
  getCandidateSkills,
  getMatchedCriteria,
  getMissingCriteria,
  getRecommendationClass,
  joinList,
} from "../utils/candidates";

type CandidateRowProps = {
  candidate: ScreenedCandidate;
  onPreview: (candidate: ScreenedCandidate) => void;
  onReveal: (candidate: ScreenedCandidate) => void;
};

export function CandidateRow({ candidate, onPreview, onReveal }: CandidateRowProps) {
  const skills = getCandidateSkills(candidate);
  const matched = getMatchedCriteria(candidate);
  const missing = getMissingCriteria(candidate);

  return (
    <article className="candidate-row">
      <div className="candidate-row-top">
        <div className="candidate-summary">
          <p className="candidate-file">{candidate.file_name}</p>
          <h3>{getCandidateName(candidate)}</h3>
          <p className="candidate-subtitle">{getCandidateDepartment(candidate)}</p>
        </div>

        <div className="candidate-badges">
          <span className={`recommendation-badge recommendation-${getRecommendationClass(candidate.recommendation)}`}>
            {candidate.recommendation}
          </span>
          <span className={`score-pill score-${getRecommendationClass(candidate.recommendation)}`}>{candidate.score}</span>
        </div>
      </div>

      <div className="candidate-meta">
        <span className="meta-chip">Skills: {joinList(skills)}</span>
        <span className="meta-chip">Matched: {joinList(matched)}</span>
        <span className="meta-chip">Missing: {joinList(missing)}</span>
      </div>

      <p className="candidate-reason">{candidate.reason}</p>

      <div className="candidate-actions">
        <button type="button" className="secondary-button" onClick={() => onPreview(candidate)}>
          Preview CV
        </button>
        <button type="button" className="secondary-button" onClick={() => onReveal(candidate)}>
          Show In Folder
        </button>
      </div>
    </article>
  );
}
