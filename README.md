# CoderX

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Narayaaana11/CoderX)](https://github.com/Narayaaana11/CoderX)
[![GitHub Issues](https://img.shields.io/github/issues/Narayaaana11/CoderX)](https://github.com/Narayaaana11/CoderX/issues)

CoderX is an open-source AI website builder that runs locally and helps you generate full-stack projects from plain-English prompts.

If this project helps you, please star the repo: https://github.com/Narayaaana11/CoderX

Repository: https://github.com/Narayaaana11/CoderX

## Table of Contents

- Overview
- Quick Start
- Full Setup
- Important Files
- Skills
- Run and Validate
- How to Use
- Project Structure
- Contributing
- Agent Setup Prompt
- Troubleshooting
- Community
- License

## Overview

- Generate complete project files from chat prompts
- Stream code updates into an in-browser editor and terminal
- Run with local LLMs via Ollama
- Optionally connect cloud LLM providers
- Use an optional Python agent pipeline for GitHub context extraction

## Quick Start

1. Clone and install:

```bash
git clone https://github.com/Narayaaana11/CoderX.git
cd CoderX
npm install
```

2. Start Ollama and pull a model:

```bash
ollama pull qwen2.5-coder:7b
ollama serve
```

3. Start CoderX:

```bash
npm run dev
```

4. Open:

http://localhost:5173/workspace

## Full Setup

### Prerequisites

- Node.js 18.18+
- Git
- Ollama

Verify:

```bash
node -v
git --version
ollama --version
```

### Optional Local Model Configuration

Copy the example files in the repo root:

```bash
cp .env.example .env
cp .env.local.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item .env.local.example .env.local
```

Then update values if needed. Minimum local setup:

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5-coder:7b
```

## Important Files

- `.env.example`: Full environment variable template for providers and agent URL
- `.env.local.example`: Local dev bindings read by `scripts/start.mjs`
- `.env`: Your actual runtime env values (do not commit secrets)
- `.env.local`: Local Wrangler binding values for dev
- `.dev.vars`: Local Cloudflare-style variables (optional in this flow)
- `wrangler.toml`: Cloudflare Pages/Workers project configuration
- `package.json`: scripts, dependencies, and Node engine requirements
- `worker-configuration.d.ts`: typed list of supported env variables

## Skills

CoderX now includes a Claude-style **Skills** section in **Model Settings**.

Use it to add development preferences such as:

- Accessibility-first UI
- Clean Architecture
- Test-driven development
- Performance optimization
- Security hardening

Where to find it:

1. Open the sidebar menu
2. Click **Model Settings**
3. Add skills under the **Skills** panel
4. Save settings

These skills are sent with chat requests and used as guidance during code generation.

## Run and Validate

Run development server:

```bash
npm run dev
```

Run project checks:

```bash
npm run typecheck
npm run test
npm run build
npm run validate:baseline
```

## How to Use

1. Open workspace UI
2. Enter a build prompt in chat
3. Watch generated files stream into editor
4. Use terminal and preview to verify output

Example prompts:

- Build a portfolio website with hero, projects, and contact form
- Build a task manager with filtering and local storage
- Build a weather dashboard with responsive layout

## Project Structure

```text
CoderX/
  app/                  # Remix frontend
	 routes/             # API + UI routes
	 lib/                # Runtime, server LLM, webcontainer logic
	 components/         # UI components
	 types/              # Shared TS types
  agent/                # Optional Python FastAPI agent service
	 api/                # Agent routes
	 agent/              # Search, select, clone, analyze, extract pipeline
  functions/            # Cloudflare Pages entrypoint
  scripts/              # Local start scripts
```

## Contributing

Contributions are welcome.

### Report Bugs

Open an issue: https://github.com/Narayaaana11/CoderX/issues

Include:

- Reproduction steps
- Expected vs actual behavior
- OS, Node version, model used

### Suggest Features

Open an issue with enhancement context and user impact.

### Submit a Pull Request

1. Fork the repo
2. Create branch: `feature/your-change`
3. Implement changes
4. Run `npm run validate:baseline`
5. Open PR to `main`

### Contribution Standards

- Keep TypeScript strict
- Add/update tests for logic changes
- Avoid hardcoded secrets
- Keep docs aligned with behavior

## Agent Setup Prompt

Use this prompt to ask an AI agent to set up the full project end-to-end:

```text
Set up the CoderX repository from scratch on this machine.

Requirements:
- Node.js 18.18+
- Git
- Ollama installed

Steps:
1. Clone repo:
	git clone https://github.com/Narayaaana11/CoderX.git
	cd CoderX
2. Install dependencies:
	npm install
3. Verify tools:
	node -v
	git --version
	ollama --version
4. Start Ollama:
	ollama serve
5. Pull model:
	ollama pull qwen2.5-coder:7b
6. Create optional .env.local:
	OLLAMA_BASE_URL=http://127.0.0.1:11434
	OLLAMA_MODEL=qwen2.5-coder:7b
7. Run app:
	npm run dev
8. Validate project:
	npm run validate:baseline
9. Confirm app loads at:
	http://localhost:5173/workspace

If setup fails:
- Check Ollama process: ollama ps
- Reinstall dependencies: npm install
- Try alternate port: npm run dev -- --port 5174
```

## Troubleshooting

### Ollama not responding

```bash
ollama ps
ollama list
ollama serve
```

### Dependency issues

```bash
npm install
```

### Port conflict

```bash
npm run dev -- --port 5174
```

### Rebuild from clean state

```bash
npm run build
```

## Community

- Issues: https://github.com/Narayaaana11/CoderX/issues
- Pull Requests: https://github.com/Narayaaana11/CoderX/pulls
- Discussions: https://github.com/Narayaaana11/CoderX/discussions

## License

MIT. See LICENSE.
