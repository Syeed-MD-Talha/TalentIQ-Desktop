import { providerPresets } from "../config/providers";
import type {
  ProviderId,
  ProviderProfile,
  ScreenedCandidate,
  ScreeningResult,
} from "../types/app";

export function escapeCsv(value: string | number | null | undefined) {
  const normalized = value === null || value === undefined ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function joinList(values: string[]) {
  return values.length ? values.join(", ") : "Not available";
}

export function getCandidateName(candidate: ScreenedCandidate) {
  return candidate.profile?.name ?? candidate.file_name.replace(/\.pdf$/i, "") ?? "Unknown candidate";
}

export function getCandidateDepartment(candidate: ScreenedCandidate) {
  return candidate.profile?.department ?? "Department not available";
}

export function getCandidateSkills(candidate: ScreenedCandidate) {
  return candidate.profile?.skills ?? [];
}

export function getMatchedCriteria(candidate: ScreenedCandidate) {
  return candidate.matched_criteria ?? [];
}

export function getMissingCriteria(candidate: ScreenedCandidate) {
  return candidate.missing_criteria ?? [];
}

export function getRecommendationClass(recommendation: string) {
  return recommendation.toLowerCase().replace(/\s+/g, "-");
}

export function getRunState(loading: boolean, result: ScreeningResult | null) {
  if (loading) {
    return "Processing";
  }

  if (result) {
    return "Completed";
  }

  return "Idle";
}

export function getStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "required") {
    return "status-danger";
  }

  if (normalized === "connected" || normalized === "ready") {
    return "status-success";
  }

  return "status-neutral";
}

export function getProviderPreset(providerId: ProviderId) {
  return providerPresets.find((preset) => preset.id === providerId) ?? providerPresets[0];
}

export function requiresApiKey(providerId: ProviderId) {
  return getProviderPreset(providerId).requiresApiKey ?? true;
}

export function isProviderConfigured(providerId: ProviderId, profile: ProviderProfile) {
  const hasBasics = Boolean(profile.baseUrl.trim()) && Boolean(profile.model.trim());
  return requiresApiKey(providerId) ? hasBasics && Boolean(profile.apiKey.trim()) : hasBasics;
}
