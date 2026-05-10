import type { ProviderPreset } from "../types/app";

export const APP_SETTINGS_KEY = "talentiq.desktop.settings";

export const providerPresets: ProviderPreset[] = [
  {
    id: "groq",
    label: "Groq",
    category: "Fast inference",
    description: "High-speed hosted inference for production screening runs.",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-8b-instant",
  },
  {
    id: "openai",
    label: "OpenAI",
    category: "General reasoning",
    description: "OpenAI-compatible screening with strong instruction following.",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
  },
  {
    id: "gemini",
    label: "Gemini",
    category: "Google models",
    description: "Use Google's Gemini models through the OpenAI-compatible endpoint.",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.0-flash",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    category: "Reasoning focused",
    description: "Connect to DeepSeek's OpenAI-compatible API for cost-efficient screening.",
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
  },
  {
    id: "ollama",
    label: "Ollama Cloud",
    category: "Hosted Ollama",
    description: "Connect a hosted Ollama-compatible endpoint with your own API key.",
    baseUrl: "https://ollama.com",
    defaultModel: "gpt-oss:20b",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    category: "Multi-model routing",
    description: "Route screenings across many commercial and open-source models.",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
  },
  {
    id: "custom",
    label: "Custom Endpoint",
    category: "Enterprise stack",
    description: "Connect any OpenAI-compatible internal or third-party endpoint.",
    baseUrl: "https://your-endpoint.example.com/v1",
    defaultModel: "your-model-name",
  },
];
