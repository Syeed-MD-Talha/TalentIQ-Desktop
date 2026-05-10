use crate::models::{
    ApiResponse, CandidateProfile, LlmVerdict, OllamaChatResponse, ProgressEvent, ScreenedCandidate,
    ScreeningContext, ScreeningProvider, ScreeningResult,
};
use regex::Regex;
use serde_json::Value;
use std::path::{Path, PathBuf};
use tauri::Emitter;
use walkdir::WalkDir;

pub(crate) async fn run_screening(
    app: tauri::AppHandle,
    input_dir: String,
    instruction: String,
    provider: ScreeningProvider,
) -> Result<ScreeningResult, String> {
    let pdf_paths = collect_pdf_paths(&input_dir)?;
    let total_cvs = pdf_paths.len();

    let mut shortlisted_candidates = Vec::new();
    let mut review_candidates = Vec::new();
    let mut weak_match_candidates = Vec::new();
    let mut all_candidates = Vec::new();

    let client = reqwest::Client::new();

    for (index, path) in pdf_paths.iter().enumerate() {
        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown.pdf")
            .to_string();

        emit_progress(&app, index + 1, total_cvs, &file_name, "processing");

        let candidate = screen_single_cv(&client, path, &file_name, &instruction, &provider).await;

        emit_progress(&app, index + 1, total_cvs, &file_name, &candidate.recommendation);

        match candidate.recommendation.as_str() {
            "Shortlist" => shortlisted_candidates.push(candidate.clone()),
            "Needs HR Review" => review_candidates.push(candidate.clone()),
            _ => weak_match_candidates.push(candidate.clone()),
        }

        all_candidates.push(candidate);
    }

    Ok(ScreeningResult {
        total_cvs,
        processed_cvs: all_candidates.len(),
        shortlist_count: shortlisted_candidates.len(),
        review_count: review_candidates.len(),
        weak_match_count: weak_match_candidates.len(),
        shortlisted_candidates,
        review_candidates,
        weak_match_candidates,
        all_candidates,
    })
}

pub(crate) async fn fetch_provider_models(provider: ScreeningProvider) -> Result<Vec<String>, String> {
    let base_url = provider.base_url.trim().trim_end_matches('/');

    if base_url.is_empty() {
        return Err(format!("{} base URL is missing. Add it in Settings.", provider.label));
    }

    let endpoint = if provider.id == "ollama" {
        format!("{base_url}/api/tags")
    } else {
        format!("{base_url}/models")
    };
    let client = reqwest::Client::new();
    let mut request = client.get(&endpoint).header("Content-Type", "application/json");
    let api_key = provider.api_key.trim();

    if !api_key.is_empty() {
        request = request.header("Authorization", format!("Bearer {api_key}"));
    }

    let response = request
        .send()
        .await
        .map_err(|e| format!("Network error loading models from {}: {e}", provider.label))?
        .error_for_status()
        .map_err(|e| format!("{} model list error: {e}", provider.label))?;

    let payload = response
        .json::<Value>()
        .await
        .map_err(|e| format!("Could not parse {} model list: {e}", provider.label))?;

    let mut models: Vec<String> = if provider.id == "ollama" {
        payload
            .get("models")
            .and_then(Value::as_array)
            .map(|items| {
                items
                    .iter()
                    .filter_map(|item| {
                        item.get("name")
                            .or_else(|| item.get("model"))
                            .and_then(Value::as_str)
                            .map(str::trim)
                            .filter(|name| !name.is_empty())
                            .map(ToOwned::to_owned)
                    })
                    .collect()
            })
            .unwrap_or_default()
    } else {
        payload
            .get("data")
            .and_then(Value::as_array)
            .map(|items| {
                items
                    .iter()
                    .filter_map(|item| {
                        item.get("id")
                            .and_then(Value::as_str)
                            .map(str::trim)
                            .filter(|id| !id.is_empty())
                            .map(ToOwned::to_owned)
                    })
                    .collect()
            })
            .unwrap_or_default()
    };

    models.sort();
    models.dedup();

    if models.is_empty() {
        return Err(format!("{} did not return any models.", provider.label));
    }

    Ok(models)
}

async fn screen_single_cv(
    client: &reqwest::Client,
    path: &Path,
    file_name: &str,
    instruction: &str,
    provider: &ScreeningProvider,
) -> ScreenedCandidate {
    let file_path = path.to_string_lossy().to_string();
    let cv_text = match pdf_extract::extract_text(path) {
        Ok(t) if !t.trim().is_empty() => t,
        Ok(_) => {
            return failed_candidate(file_name, &file_path, "PDF has no extractable text (it may be scanned).");
        }
        Err(e) => {
            return failed_candidate(file_name, &file_path, &format!("Could not read PDF: {e}"));
        }
    };
    let profile = extract_candidate_profile(&cv_text, file_name);

    let context = build_screening_context(instruction, &cv_text);

    if context.requires_industry_experience && !context.has_industry_experience {
        return ScreenedCandidate {
            file_name: file_name.to_string(),
            file_path,
            recommendation: "Weak Match".to_string(),
            profile: Some(profile),
            score: 15,
            reason: "Rejected because the resume does not show clear industry job experience. Academic projects, volunteering, contests, and training were not treated as industry employment.".to_string(),
        };
    }

    let verdict = match ask_llm(client, instruction, &cv_text, provider, &context).await {
        Ok(v) => v,
        Err(e) => return failed_candidate(file_name, &file_path, &e),
    };

    let final_score = if context.industry_only_filter && context.has_industry_experience {
        verdict.score.max(85)
    } else {
        verdict.score
    };

    let recommendation = score_to_recommendation(final_score);

    ScreenedCandidate {
        file_name: file_name.to_string(),
        file_path,
        recommendation,
        profile: Some(profile),
        score: final_score,
        reason: verdict.reason,
    }
}

async fn ask_llm(
    client: &reqwest::Client,
    instruction: &str,
    cv_text: &str,
    provider: &ScreeningProvider,
    context: &ScreeningContext,
) -> Result<LlmVerdict, String> {
    let api_key = provider.api_key.trim();
    let base_url = provider.base_url.trim().trim_end_matches('/');
    let model = provider.model.trim();

    if base_url.is_empty() {
        return Err(format!("{} base URL is missing. Add it in Settings.", provider.label));
    }

    if model.is_empty() {
        return Err(format!("{} model is missing. Add it in Settings.", provider.label));
    }

    let prompt = format!(
        r#"You are a CV screening assistant.

Provider context:
- Provider ID: {provider_id}
- Provider label: {provider_label}

Screening guardrails:
- Treat explicit must-have requirements as hard filters.
- If a candidate does not satisfy a hard filter, the score must be below 50.
- Do not count academic projects, contest participation, volunteering, training classes, or publications as industry job experience.
- Use the extracted evidence below when judging industry experience.

Hiring criteria:
{instruction}

Derived evidence:
- Requires industry experience: {requires_industry_experience}
- This is an industry-only filter: {industry_only_filter}
- Resume shows industry experience: {has_industry_experience}
- Industry evidence: {industry_evidence}

CV text:
{cv_text}

Evaluate the candidate against the criteria above.
Respond with ONLY valid JSON in this exact shape:
{{
  "score": <integer 0-100>,
  "reason": "<one or two sentences explaining the score>"
}}

Scoring guide:
- 80-100 -> clearly meets the criteria
- 50-79 -> partially meets the criteria or information is unclear
- 0-49 -> does not meet the criteria"#,
        provider_id = provider.id,
        provider_label = provider.label,
        requires_industry_experience = context.requires_industry_experience,
        industry_only_filter = context.industry_only_filter,
        has_industry_experience = context.has_industry_experience,
        industry_evidence = context
            .industry_evidence
            .as_deref()
            .unwrap_or("No explicit company employment evidence found.")
    );

    let content = if provider.id == "ollama" {
        let body = serde_json::json!({
            "model": model,
            "messages": [
                { "role": "system", "content": "You are a strict JSON generator. Return only valid JSON and no extra text." },
                { "role": "user", "content": prompt }
            ],
            "stream": false,
            "options": {
                "temperature": 0.1
            }
        });

        let endpoint = format!("{base_url}/api/chat");
        let response = client.post(&endpoint).header("Content-Type", "application/json");

        let response = if api_key.is_empty() {
            response
        } else {
            response.header("Authorization", format!("Bearer {api_key}"))
        }
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error calling {}: {e}", provider.label))?
        .error_for_status()
        .map_err(|e| format!("{} API error: {e}", provider.label))?
        .json::<OllamaChatResponse>()
        .await
        .map_err(|e| format!("Could not parse {} response: {e}", provider.label))?;

        response.message.content
    } else {
        let body = serde_json::json!({
            "model": model,
            "messages": [
                { "role": "system", "content": "You are a strict JSON generator. Return only valid JSON and no extra text." },
                { "role": "user", "content": prompt }
            ],
            "temperature": 0.1,
            "max_tokens": 256,
            "response_format": { "type": "json_object" }
        });

        let endpoint = format!("{base_url}/chat/completions");
        let response = client.post(&endpoint).header("Content-Type", "application/json");

        let response = if api_key.is_empty() {
            response
        } else {
            response.header("Authorization", format!("Bearer {api_key}"))
        }
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error calling {}: {e}", provider.label))?
        .error_for_status()
        .map_err(|e| format!("{} API error: {e}", provider.label))?
        .json::<ApiResponse>()
        .await
        .map_err(|e| format!("Could not parse {} response: {e}", provider.label))?;

        response
            .choices
            .into_iter()
            .next()
            .ok_or_else(|| format!("{} returned no choices", provider.label))?
            .message
            .content
    };

    let verdict = serde_json::from_str::<LlmVerdict>(&content)
        .map_err(|e| format!("LLM returned unexpected JSON: {e}\nRaw: {content}"))?;

    Ok(LlmVerdict {
        score: verdict.score.min(100),
        reason: verdict.reason,
    })
}

fn collect_pdf_paths(input_dir: &str) -> Result<Vec<PathBuf>, String> {
    let paths: Vec<PathBuf> = WalkDir::new(input_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path().is_file()
                && e.path()
                    .extension()
                    .and_then(|x| x.to_str())
                    .map(|x| x.eq_ignore_ascii_case("pdf"))
                    .unwrap_or(false)
        })
        .map(|e| e.path().to_path_buf())
        .collect();

    if paths.is_empty() {
        Err("No PDF files found in the selected folder.".to_string())
    } else {
        Ok(paths)
    }
}

fn score_to_recommendation(score: u8) -> String {
    match score {
        80..=100 => "Shortlist".to_string(),
        50..=79 => "Needs HR Review".to_string(),
        _ => "Weak Match".to_string(),
    }
}

fn failed_candidate(file_name: &str, file_path: &str, reason: &str) -> ScreenedCandidate {
    ScreenedCandidate {
        file_name: file_name.to_string(),
        file_path: file_path.to_string(),
        recommendation: "Needs HR Review".to_string(),
        profile: Some(CandidateProfile {
            name: Some(file_name.replace(".pdf", "")),
            email: None,
            department: None,
            graduation_status: None,
            skills: Vec::new(),
            experience_years: None,
            cgpa: None,
            projects: None,
            education: Vec::new(),
            summary: None,
        }),
        score: 50,
        reason: reason.to_string(),
    }
}

fn extract_candidate_profile(cv_text: &str, file_name: &str) -> CandidateProfile {
    let email_regex = Regex::new(r"(?i)\b[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}\b").unwrap();
    let cgpa_regex = Regex::new(r"(?i)\b(?:cgpa|gpa)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?(?:/[0-9]+(?:\.[0-9]+)?)?)").unwrap();

    let lines: Vec<String> = cv_text
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .map(|line| line.replace('\u{a0}', " "))
        .collect();

    let name = lines
        .iter()
        .find(|line| {
            !line.contains('@')
                && line.chars().filter(|ch| ch.is_alphabetic()).count() >= 6
                && line.split_whitespace().count() <= 6
        })
        .cloned()
        .or_else(|| Some(file_name.replace(".pdf", "")));

    let email = email_regex
        .find(cv_text)
        .map(|matched| matched.as_str().trim().to_string());

    let cgpa = cgpa_regex
        .captures(cv_text)
        .and_then(|captures| captures.get(1))
        .map(|matched| matched.as_str().to_string());

    CandidateProfile {
        name,
        email,
        department: None,
        graduation_status: None,
        skills: Vec::new(),
        experience_years: None,
        cgpa,
        projects: None,
        education: Vec::new(),
        summary: None,
    }
}

fn build_screening_context(instruction: &str, cv_text: &str) -> ScreeningContext {
    let requires_industry_experience = instruction_requires_industry_experience(instruction);
    let industry_only_filter = instruction_is_industry_only_filter(instruction);
    let (has_industry_experience, industry_evidence) = infer_industry_experience(cv_text);

    ScreeningContext {
        requires_industry_experience,
        industry_only_filter,
        has_industry_experience,
        industry_evidence,
    }
}

fn instruction_requires_industry_experience(instruction: &str) -> bool {
    let normalized = instruction.to_lowercase();

    let mentions_industry = normalized.contains("industry");
    let mentions_job = normalized.contains("job")
        || normalized.contains("professional experience")
        || normalized.contains("work experience")
        || normalized.contains("employment");
    let mentions_experience = normalized.contains("experience");

    (mentions_industry && mentions_experience) || (mentions_job && mentions_experience)
}

fn instruction_is_industry_only_filter(instruction: &str) -> bool {
    let normalized = instruction.to_lowercase();

    instruction_requires_industry_experience(instruction)
        && (normalized.contains("only industry")
            || normalized.contains("only candidates who have")
            || normalized.contains("only job experience")
            || normalized.contains("only professional experience"))
}

fn infer_industry_experience(cv_text: &str) -> (bool, Option<String>) {
    let normalized = cv_text.to_lowercase();
    let lines: Vec<&str> = cv_text.lines().map(str::trim).filter(|line| !line.is_empty()).collect();

    let headings = [
        "professional experience",
        "work experience",
        "employment history",
        "career summary",
    ];
    let role_markers = [
        "software engineer",
        "engineer",
        "developer",
        "intern",
        "consultant",
        "analyst",
        "specialist",
        "manager",
        "executive",
    ];
    let company_markers = [
        "ltd",
        "limited",
        "inc",
        "corp",
        "company",
        "technologies",
        "solutions",
        "systems",
        "labs",
        "bjit",
    ];
    let non_industry_markers = [
        "project",
        "publication",
        "volunteer",
        "training",
        "contest",
        "problem setter",
        "session volunteer",
    ];

    for (index, line) in lines.iter().enumerate() {
        let lower_line = line.to_lowercase();
        let next_line = lines.get(index + 1).copied().unwrap_or_default();
        let snippet = format!("{line} {next_line}");
        let lower_snippet = snippet.to_lowercase();

        let heading_match = headings.iter().any(|marker| lower_line.contains(marker));
        let role_match = role_markers.iter().any(|marker| lower_snippet.contains(marker));
        let company_match = company_markers.iter().any(|marker| lower_snippet.contains(marker));
        let non_industry_match = non_industry_markers
            .iter()
            .any(|marker| lower_snippet.contains(marker));

        if heading_match && role_match && !non_industry_match {
            return (true, Some(snippet));
        }

        if role_match && company_match && !non_industry_match {
            return (true, Some(snippet));
        }
    }

    if normalized.contains("professional experience") && normalized.contains("present") {
        return (
            true,
            Some("Professional experience section with an active employment date range.".to_string()),
        );
    }

    (false, None)
}

fn emit_progress(app: &tauri::AppHandle, processed: usize, total: usize, file_name: &str, status: &str) {
    let _ = app.emit(
        "screening-progress",
        ProgressEvent {
            processed,
            total,
            file_name: file_name.to_string(),
            status: status.to_string(),
        },
    );
}
