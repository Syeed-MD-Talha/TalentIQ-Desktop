export type CandidateProfile = {
  name: string | null;
  email: string | null;
  department: string | null;
  graduation_status: string | null;
  skills: string[];
  experience_years: number | null;
  cgpa: string | null;
  projects: number | null;
  education: string[];
  summary: string | null;
};

export type ScreenedCandidate = {
  file_name: string;
  file_path: string;
  recommendation: string;
  profile?: CandidateProfile | null;
  matched_criteria?: string[];
  missing_criteria?: string[];
  score: number;
  reason: string;
};

export type ScreeningResult = {
  total_cvs: number;
  processed_cvs: number;
  shortlist_count: number;
  review_count: number;
  weak_match_count: number;
  shortlisted_candidates: ScreenedCandidate[];
  review_candidates: ScreenedCandidate[];
  weak_match_candidates: ScreenedCandidate[];
  all_candidates: ScreenedCandidate[];
};

export type ProgressEvent = {
  processed: number;
  total: number;
  file_name: string;
  status: string;
};

export type Notice = {
  tone: "success" | "error" | "info";
  message: string;
};

export type ResultView = "all" | "shortlist" | "review" | "weak";
export type AppSection = "overview" | "pipeline" | "results" | "settings";
export type ProviderId = "groq" | "openai" | "gemini" | "deepseek" | "ollama" | "openrouter" | "custom";

export type ProviderProfile = {
  label: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  rememberKey: boolean;
};

export type AppSettings = {
  activeProviderId: ProviderId;
  providers: Record<ProviderId, ProviderProfile>;
  autoOpenResults: boolean;
  exportWithTimestamp: boolean;
};

export type ProviderPreset = {
  id: ProviderId;
  label: string;
  category: string;
  description: string;
  baseUrl: string;
  defaultModel: string;
  requiresApiKey?: boolean;
};

export type ProviderModelList = {
  models: string[];
};
