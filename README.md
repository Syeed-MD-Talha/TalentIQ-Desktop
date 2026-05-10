# TalentIQ Desktop

AI-assisted desktop workspace for screening, reviewing, and exporting candidate resumes.

TalentIQ Desktop is a local-first resume screening application built with Tauri, React, TypeScript, and Rust. It helps recruiters and hiring teams process PDF resumes using configurable AI-powered screening workflows while keeping the experience fast and desktop-focused.

---

## Features

- AI-assisted candidate screening using customizable hiring prompts
- Local PDF resume processing workflow
- Categorized candidate review pipeline:
  - `Shortlist`
  - `HR Review`
  - `Weak Match`
- Multi-provider LLM support
- Runtime model discovery for supported providers
- Resume preview using the system PDF viewer
- Reveal resume location directly from the app
- CSV export for shortlisted candidates
- Modern desktop UI with custom window chrome

---

## Screening Workflow

TalentIQ Desktop follows a structured screening pipeline:

```text
PDF Resume
   ↓
Text Extraction
   ↓
Candidate Profile Extraction
   ↓
AI-Based Criteria Assessment
   ↓
Score & Recommendation
   ↓
Categorized Review Pipeline
```

The application extracts structured candidate information from resumes, compares it against recruiter-defined hiring requirements, and generates a recommendation with supporting reasoning.

---

## Candidate Categories

### Shortlist

Strong candidate match based on the provided hiring criteria.

### HR Review

Borderline candidates, unclear resumes, or partially matched profiles that require manual review.

### Weak Match

Candidates with low alignment to the hiring requirements.

---

## Screenshots

Store screenshots in:

```text
docs/screenshots/
```

### Overview

![TalentIQ Overview](docs/screenshots/overview.png)

### Pipeline

![TalentIQ Pipeline](docs/screenshots/pipeline.png)

### Results

![TalentIQ Results](docs/screenshots/results.png)

### Settings

![TalentIQ Settings](docs/screenshots/settings.png)

---

## Supported Providers

TalentIQ Desktop currently supports:

- `Groq`
- `OpenAI`
- `Gemini`
- `DeepSeek`
- `OpenRouter`
- `Ollama Cloud`
- `Custom Endpoint`

Most providers use OpenAI-compatible APIs.  
`Custom Endpoint` can be used for internal gateways or third-party compatible services.

---

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite

### Backend

- Rust
- Tauri 2
- reqwest
- pdf-extract

---

## Project Structure

```text
src/
  components/     Reusable UI components
  config/         Provider presets and application constants
  sections/       Main application views
  types/          Shared frontend types
  utils/          Frontend helper functions
  App.tsx         Frontend application coordinator

src-tauri/src/
  commands/       Tauri commands exposed to the frontend
  screening/      Resume screening and provider request logic
  models.rs       Shared Rust data models
  lib.rs          Tauri application wiring
  main.rs         Desktop entry point
```

---

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js
- npm
- Rust toolchain
- Tauri platform prerequisites

On Windows, this generally includes:

- Rust MSVC toolchain
- Visual Studio Build Tools

---

## Installation

Install frontend dependencies:

```bash
npm install
```

---

## Development

Run the application in development mode:

```bash
npm run tauri dev
```

The frontend development server runs on:

```text
http://localhost:3000
```

---

## Production Build

Create a production desktop build:

```bash
npm run tauri build
```

On Windows, the generated installer is usually located at:

```text
src-tauri/target/release/bundle/nsis/
```

---

## Provider Configuration

### OpenAI, Groq, Gemini, DeepSeek, OpenRouter

1. Open the `Settings` section
2. Enter the provider API key
3. Load available models
4. Select the desired model
5. Confirm or customize the endpoint if required

### Ollama Cloud

1. Enter the Ollama Cloud API key
2. Keep the default endpoint unless using another hosted service
3. Load available models from the app
4. Select a model

### Custom Endpoint

Use the custom provider for:

- internal AI gateways
- self-hosted services
- OpenAI-compatible third-party APIs

---

## CSV Export

Exported CSV files currently include:

- `name`
- `email`

This keeps recruiter follow-up workflows lightweight and clean.

---

## Available Scripts

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

### Desktop Application

```bash
npm run tauri dev
npm run tauri build
```

---

## Notes

- Resume files must be in PDF format.
- Resume preview uses the operating system's default PDF viewer.
- Screening quality depends on:
  - selected model
  - provider quality
  - clarity of the hiring prompt
  - PDF text quality

---

## Disclaimer

TalentIQ Desktop is designed to assist recruiter workflows and accelerate resume review processes. Final hiring decisions should always involve human evaluation and review.
