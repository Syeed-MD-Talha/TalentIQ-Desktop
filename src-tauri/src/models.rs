use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub(crate) struct ScreenedCandidate {
    pub(crate) file_name: String,
    pub(crate) file_path: String,
    pub(crate) recommendation: String,
    pub(crate) profile: Option<CandidateProfile>,
    pub(crate) score: u8,
    pub(crate) reason: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub(crate) struct CandidateProfile {
    pub(crate) name: Option<String>,
    pub(crate) email: Option<String>,
    pub(crate) department: Option<String>,
    pub(crate) graduation_status: Option<String>,
    pub(crate) skills: Vec<String>,
    pub(crate) experience_years: Option<f32>,
    pub(crate) cgpa: Option<String>,
    pub(crate) projects: Option<u32>,
    pub(crate) education: Vec<String>,
    pub(crate) summary: Option<String>,
}

#[derive(Debug, Serialize)]
pub(crate) struct ScreeningResult {
    pub(crate) total_cvs: usize,
    pub(crate) processed_cvs: usize,
    pub(crate) shortlist_count: usize,
    pub(crate) review_count: usize,
    pub(crate) weak_match_count: usize,
    pub(crate) shortlisted_candidates: Vec<ScreenedCandidate>,
    pub(crate) review_candidates: Vec<ScreenedCandidate>,
    pub(crate) weak_match_candidates: Vec<ScreenedCandidate>,
    pub(crate) all_candidates: Vec<ScreenedCandidate>,
}

#[derive(Debug, Serialize, Clone)]
pub(crate) struct ProgressEvent {
    pub(crate) processed: usize,
    pub(crate) total: usize,
    pub(crate) file_name: String,
    pub(crate) status: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ScreeningProvider {
    pub(crate) id: String,
    pub(crate) label: String,
    pub(crate) base_url: String,
    pub(crate) model: String,
    pub(crate) api_key: String,
}

#[derive(Debug, Serialize)]
pub(crate) struct ProviderModelList {
    pub(crate) models: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub(crate) struct ApiResponse {
    pub(crate) choices: Vec<ApiChoice>,
}

#[derive(Debug, Deserialize)]
pub(crate) struct ApiChoice {
    pub(crate) message: ApiMessage,
}

#[derive(Debug, Deserialize)]
pub(crate) struct ApiMessage {
    pub(crate) content: String,
}

#[derive(Debug, Deserialize)]
pub(crate) struct OllamaChatResponse {
    pub(crate) message: ApiMessage,
}

#[derive(Debug, Deserialize)]
pub(crate) struct LlmVerdict {
    pub(crate) score: u8,
    pub(crate) reason: String,
}

#[derive(Debug, Clone)]
pub(crate) struct ScreeningContext {
    pub(crate) requires_industry_experience: bool,
    pub(crate) industry_only_filter: bool,
    pub(crate) has_industry_experience: bool,
    pub(crate) industry_evidence: Option<String>,
}
