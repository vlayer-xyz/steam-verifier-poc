# Repository Guidelines

## Project Structure & Module Organization
Source lives in `src/` with App Router screens in `src/app` (pages like `page.tsx`, protected views in `app/verified`, and API route handlers under `app/api`). Shared UI components stay in `src/components`, while `src/lib/db` holds Drizzle schemas and migration helpers, and `src/lib/services` wraps Steam and verification logic. Database migrations live in `drizzle/`, public assets in `public/`, and CLI utilities in `scripts/`; align new work with these boundaries before adding folders.

## Build, Test & Development Commands
- `npm run dev`: Start the Next.js dev server on port 3001 with Turbopack. Browse to `http://localhost:3000/?webhookUrl=https://example.com/your-webhook&callbackUrl=https://example.com/return`—the login flow is disabled until both query params are present and valid.
- `npm run build`: Produce an optimized bundle; run before deploying.
- `npm run start`: Serve the production build locally.
- `npm run lint`: Run the ESLint ruleset (`next/core-web-vitals`).
- `npm run db:generate` / `npm run db:migrate`: Generate and apply Drizzle migrations when the optional PostgreSQL layer is enabled.
- `npm run test:verify`: Exercise the end-to-end verification script; requires `STEAM_API_KEY` and a SteamID argument (`node scripts/test-verification.js 7656...`).

## Coding Style & Naming Conventions
Use TypeScript with 2-space indentation and keep ESLint clean before opening a PR. Favor PascalCase for React components, camelCase for functions and variables, and kebab-case for file names except component files. Tailwind classes should remain scoped to JSX and grouped by layout → spacing → color to aid readability; avoid inline style drift.

## Testing Guidelines
Automated coverage is currently limited to the verification smoke script. Add new tests alongside features (e.g., `src/lib/__tests__`) and extend the script rather than duplicating HTTP flows. When touching API routes, demonstrate manual verification by running `npm run test:verify <steamId>` and capture the console summary in the PR.

## Commit & Pull Request Guidelines
Commits follow concise, imperative summaries around 60 characters (see `git log` for examples such as “change verification service...”); group related changes together. PRs should explain the user impact, call out environment variable updates, and attach screenshots or terminal output for UI or verification changes. Link to any tracked issue and list manual testing steps so reviewers can replay the scenario quickly.

## Environment & Security Notes
Keep secrets in `.env.local` and never commit them; document new keys in the README’s Environment Variables table. Verification depends on public Steam profiles, so highlight that constraint when proposing workflow changes. The UI always expects `webhookUrl` and `callbackUrl` via the query string; the only env-based webhook value left is `WEBHOOK_URL`, which exists solely for the CLI verification script. Sanitize any user-supplied URLs before reflecting them in redirects or API calls.
