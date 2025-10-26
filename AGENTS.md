# Repository Guidelines

## Project Structure & Module Organization
MastraMind runs on Next.js 15 with routes and server actions kept in `src/app`. Shared presentation lives in `src/components` (with `ui` primitives and feature folders such as `booking` and `chat`). Conversational and automation logic resides in `src/ai`, while domain utilities and adapters sit in `src/services`, `src/hooks`, and `src/store`. Supporting automation and reference material live in `scripts/` and `docs/`.

## Build, Test, and Development Commands
Use `npm run dev` to launch the Next dev server on port 9002; pair it with `npm run genkit:dev` when you need the Genkit agent runtime. `npm run build` compiles production assets, and `npm run start` serves the compiled app. `npm run lint` runs the Next.js ESLint preset, and `npm run typecheck` validates TypeScript without emitting files. For environment sanity, run `npm run verify` or `npm run validate:config`. Feature probes are available via `npm run test:menu`, `npm run test:sentiment`, `npm run test:pricing`, and `npm run test:loyalty`.

## Coding Style & Naming Conventions
Follow the default TypeScript + React conventions: two-space indentation, PascalCase component files, and camelCase utilities. Keep hooks under `src/hooks` prefixed with `use`. UI styling leans on Tailwind classes; prefer composition over ad-hoc CSS. Always fix linter feedback before opening a PR, and ensure Genkit flows in `src/ai` expose typed schemas.

## Testing Guidelines
Behavior checks are script-driven; add new coverage by mirroring the `scripts/test-*.ts` pattern. Co-locate helper fixtures beside the script that consumes them. Tests should describe the capability under evaluation (e.g., `test-pricing.ts` verifies pricing prompts). Run the full suite of `npm run test:*` commands before submitting changes and document any skipped paths.

## Commit & Pull Request Guidelines
Write commits in the imperative mood (`Add menu sentiment checks`) and keep summaries under 70 characters, mirroring existing history. Structure PRs with a concise overview, linked Linear/GitHub issue, and a checklist of affected services or configs. Include screenshots or Loom clips for UI-facing changes, and call out required `.env.local` updates. Always mention whether Genkit services need to be restarted after the deployment.

## Agent Configuration Tips
Agent prompts and pipelines live in `src/ai`. Store secrets in `.env.local` and load them through `dotenv` helpers rather than hard-coding. When altering flows, run `npm run genkit:watch` to hot-reload prompt changes and document new capabilities in `docs/`.
