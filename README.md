# Verity

A QA test-case, test-suite, bug-tracking, and reporting tool. Express API (`server/`) + React client (`client/`), run together via `npm run dev` at the root.

## Stack

- **Server**: Express + `better-sqlite3` (a local file-based SQLite database, `server/data.sqlite`)
- **Client**: React + Vite + React Router

## Local development

```bash
npm install
npm run dev
```

This starts the API on `http://localhost:5050` and the client (with hot reload) on `http://localhost:5173`, proxying `/api` requests to the server.

Copy `.env.example` to `.env` if you want GitHub issue auto-filing on failed test runs (optional — see below).

## Environment variables

See `.env.example` for the full list. None are required for local development; `GITHUB_TOKEN`/`GITHUB_ISSUES_REPO` are optional and only needed if you want marking a test run result "failed" to automatically open a GitHub issue.

## Production build

```bash
npm run build   # builds the React client into client/dist
NODE_ENV=production npm start   # serves the API and the built client from one Express process on $PORT
```

In production, Express serves the built client as static files and falls back to `index.html` for any non-`/api` route, so client-side routing (React Router) works on direct navigation and refresh.

## Deploy

This app is deployed as a single Render **Web Service** — one Node process serves both the API and the built React app, so there's nothing else to stand up.

### Why Render

The server is a genuinely long-running Express process using `better-sqlite3` (a native Node addon that reads/writes a local SQLite file) — this needs a host that runs a persistent Node process with a writable filesystem, not a serverless/edge-functions platform. That ruled out Cloudflare Pages (Workers runtime has no native-addon support at all) and made Vercel/Netlify Functions a real correctness risk (their function filesystem is ephemeral per-invocation, so writes to the SQLite file could unpredictably vanish between requests). Render runs a real container, so the data behaves normally for as long as the instance is up.

**The trade-off**: Render's free tier doesn't include a persistent disk, so `server/data.sqlite` resets on every redeploy and after the service spins down from ~15 minutes of inactivity (next request triggers a ~1-minute cold start). The app already re-seeds demo data automatically whenever it finds an empty database (see `server/db.js`), so a reset just looks like a fresh demo rather than a crash — but don't rely on this deployment for data you need to keep. If you need durability, attach a paid Render Persistent Disk, or point the app at a hosted database instead.

### Deploy it yourself

This repo includes a [`render.yaml`](./render.yaml) blueprint, so Render can create and configure the service automatically.

**One-time prerequisite**: push this repo to GitHub (already done if you're reading this from the repo).

Run this in your terminal:

```bash
brew install render && render login && render workspace set && render services create --repo https://github.com/yeldananurumova/bootcamp-app --branch main --name verity --type web_service --runtime node --plan free --build-command "npm install --include=dev && npm run build" --start-command "npm start" --env-var NODE_ENV=production --auto-deploy=true
```

What this does:
1. Installs the official Render CLI via Homebrew
2. `render login` opens your browser to sign in / authorize the CLI (and, on a fresh Render account, to connect your GitHub account so Render can read the repo — this requires the target repo be granted access under the GitHub App's repository permissions first, or the `--repo` URL will be rejected as "unfetchable")
3. `render workspace set` picks which Render workspace to create the service in (only needed once per account)
4. `render services create` creates the web service from this repo on the free plan and triggers the first deploy

Notes from an actual first run of this flow:
- `--type` wants `web_service`, not `web` (the `render.yaml` blueprint format uses `web`, but the CLI's own flag uses the longer enum name — these are inconsistent between the two Render config surfaces)
- The build command explicitly passes `--include=dev` to `npm install`. Without it, `NODE_ENV=production` (needed at runtime) also makes `npm install` skip devDependencies at build time — and `vite`, needed to build the client, is a devDependency. Skipping this flag fails the build with `sh: 1: vite: not found`
- **If `--plan free` is rejected**: open the service in the Render dashboard and switch its plan to **Free** manually — a one-time, one-click fix.
- A service created via `render services create` (rather than a blueprint "Apply") is **not** linked to `render.yaml` — editing that file later won't change the live service's settings. Update the Build/Start Command directly in the dashboard (Settings → Build & Deploy) if you need to change them after creation.

After the deploy finishes, add the optional GitHub issue-filing secrets (only if you want that feature) in the Render dashboard under the service's **Environment** tab — `GITHUB_TOKEN` and `GITHUB_ISSUES_REPO` are declared in `render.yaml` with `sync: false`, meaning Render will prompt for them there rather than expecting them in the blueprint.

Render will print the service's live `.onrender.com` URL once the deploy completes (also visible any time in the dashboard).
