# TalentIQ Desktop

TalentIQ Desktop is a Tauri + React desktop app for screening PDF resumes with LLM providers. It helps a recruiter or hiring manager choose a CV folder, define a screening rule, run an automated review, preview selected resumes, and export shortlisted contacts to CSV.

## Features

- Desktop-first workflow built with Tauri, React, TypeScript, and Rust
- Screen PDF resumes from a local folder
- Configure multiple providers from the UI
- Discover models from supported providers directly in Settings
- Review candidates by bucket: `Shortlist`, `HR Review`, and `Weak Match`
- Preview a selected CV in the system PDF viewer
- Reveal the original CV file in the system file explorer
- Export selected candidates to CSV with only `name` and `email`
- Custom desktop window chrome and polished app-style UI

## Supported Providers

The app currently includes presets for:

- `Groq`
- `OpenAI`
- `Gemini`
- `DeepSeek`
- `Ollama Cloud`
- `OpenRouter`
- `Custom Endpoint`

Most providers use OpenAI-compatible APIs. `Ollama Cloud` uses Ollama's cloud endpoints.

## How It Works

1. Open the app.
2. Go to `Settings` and configure a provider.
3. Optionally load the provider's available models and pick one.
4. Go to `Pipeline`.
5. Choose a folder that contains PDF resumes.
6. Write the hiring rule or candidate selection prompt.
7. Start screening.
8. Review the result buckets in `Results`.
9. Preview CVs or export selected candidates to CSV.

## Tech Stack

- Frontend: React 19, TypeScript, Vite
- Desktop shell: Tauri 2
- Backend: Rust
- PDF text extraction: `pdf-extract`
- HTTP client: `reqwest`

## Project Structure

The project is now split into focused frontend and backend modules.

```text
src/
  components/     Reusable UI building blocks
  config/         Provider presets and app constants
  sections/       Main app screens
  types/          Shared frontend TypeScript types
  utils/          Frontend helpers
  App.tsx         App coordinator

src-tauri/src/
  commands/       Tauri commands exposed to the frontend
  screening/      Resume screening and provider communication logic
  models.rs       Shared Rust data models
  lib.rs          Tauri app wiring
  main.rs         Desktop entry point
```

## Local Development

### Prerequisites

Install the usual Tauri prerequisites for your platform, plus:

- Node.js
- npm
- Rust toolchain

On Windows, make sure the Rust/MSVC build tools required by Tauri are installed.

### Install dependencies

```bash
npm install
```

### Run the app in development

```bash
npm run tauri dev
```

This starts the Vite dev server on `http://localhost:3000` and launches the Tauri desktop window.

## Build the Desktop App

To create a production build:

```bash
npm run tauri build
```

On Windows, the installer is typically generated under:

```text
src-tauri/target/release/bundle/nsis/
```

You can share the generated `setup.exe` with other users.

## Provider Setup Notes

### OpenAI / Groq / Gemini / DeepSeek / OpenRouter

- Add your API key in `Settings`
- Choose the model you want
- Use `Load Models` when supported

### Ollama Cloud

- Use your Ollama Cloud API key
- Keep the base endpoint pointed at `https://ollama.com` unless you are using a different hosted compatible endpoint
- Load models from the app, then choose one

### Custom Endpoint

Use this when you have your own OpenAI-compatible API server or an internal gateway.

## Export Format

The CSV export currently includes only:

- `name`
- `email`

This keeps the export simple for recruiter follow-up workflows.

## Notes

- The app expects resumes in PDF format.
- CV preview opens the file with the operating system's default PDF viewer.
- Different providers may return different quality of screening results depending on the prompt and model.

## Scripts

- `npm run dev` - start the Vite frontend
- `npm run build` - build the frontend
- `npm run preview` - preview the built frontend
- `npm run tauri dev` - run the desktop app in development
- `npm run tauri build` - create a production desktop build

## Recommended Git Workflow

If you want to publish this project to GitHub:

```bash
git init
git branch -M main
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Future Improvements

- Inline PDF preview inside the app
- Batch export options
- Saved prompt templates
- Better candidate profile extraction
- More provider-specific health checks

## License

Add your preferred license here before publishing publicly.
