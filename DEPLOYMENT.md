# LineRescue AI — Frontend + Backend Deployment Guide

## What is included

This repository contains both parts of the LineRescue AI website:

- **Frontend:** React + Vite application in `client/`
- **Backend:** Express/Node server in `server/`
- **Shared code:** `shared/`
- **SAP adapter:** `server/_core/sap.ts`
- **Container deployment:** `Dockerfile`
- **Environment template:** `.env.example`

The production server serves the built frontend and backend together on port `3000`. This is the easiest deployment option because it keeps the frontend and backend on the same origin.

## Important: GitHub Pages limitation

GitHub is suitable for storing the source code, but **GitHub Pages cannot run the Node/Express backend**. Do not deploy this full-stack project to GitHub Pages if you need `/api/health`, `/api/sap/status`, or `/api/sap/material-stock` to work.

Recommended setup:

1. Push this repository to GitHub.
2. Connect the GitHub repository to a container-capable host such as Render, Railway, Fly.io, Azure Container Apps, or another Docker host.
3. Deploy using the included `Dockerfile`.
4. Set backend environment variables only in the hosting provider's server-side Environment/Secrets settings.

## Option A — Deploy the complete app with Docker

From the repository root:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm start
```

The app listens on port `3000` by default. A hosting provider should expose the same port and use this health endpoint:

```text
GET /api/health
```

Build and run locally with Docker:

```bash
docker build -t linerescue-ai .
docker run --rm -p 3000:3000 linerescue-ai
```

Then open:

```text
http://localhost:3000
```

## Option B — Deploy on Render using Docker

1. Create a GitHub repository and upload this project.
2. In Render, choose **New → Web Service**.
3. Connect the GitHub repository.
4. Choose **Docker** as the runtime.
5. Render will use the root `Dockerfile`.
6. Set the health check path to `/api/health`.
7. Set the service port to `3000` if Render asks for it.
8. Add server-side environment variables only if an authorized SAP tenant is available.
9. Deploy the service.

The application will serve both the frontend and backend from one public URL.

## Option C — Deploy on Railway using Docker

1. Push the project to GitHub.
2. Create a new Railway project from the GitHub repository.
3. Railway should detect the root `Dockerfile`.
4. Set the service port to `3000` if required.
5. Add `/api/health` as the health check if the platform requests one.
6. Add SAP secrets only in Railway Variables.
7. Deploy and open the generated domain.

## SAP environment variables

The application is safe in Demo Mode when these values are not configured. To connect to a real SAP tenant, configure these values on the backend host only:

```text
SAP_BASE_URL=https://your-sap-tenant.example
SAP_CLIENT_ID=your-server-side-client-id
SAP_CLIENT_SECRET=your-server-side-client-secret
SAP_TOKEN_URL=https://your-sap-tenant.example/oauth/token
SAP_STOCK_PATH=/sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MatlStkInAcctMod
```

Never rename these to `VITE_*` variables. Never commit real values to GitHub. The current project intentionally remains in synthetic Demo Mode unless a real authorized read-only SAP request succeeds.

## GitHub upload commands

Create an empty GitHub repository first, then run from the project folder:

```bash
git init
git add .
git commit -m "Initial LineRescue AI full-stack project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

The repository's `.gitignore` excludes local dependencies, build output, environment files, and secrets. Keep `.env.example`; do not upload `.env`.

## Local development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
pnpm test
pnpm check
pnpm build
```

## Routes

- `/` — Executive Overview
- `/simulator` — SafeStock Validator
- `/recovery` — Recovery Plans
- `/impact` — Impact Map
- `/audit` — Evidence & Audit
- `/data` — Data & Assumptions
- `/sap` — SAP Architecture
- `/business` — Business Value

## Current published website

https://linerescue-dcu65en9.manus.space

## Security and product limitation

LineRescue AI is an explainable, read-only decision-support prototype. It does not create, change, reserve, post, or delete SAP inventory. Without authorized SAP configuration, the SAP page shows Demo Mode and the protected material-stock endpoint returns an explicit not-configured response rather than fabricated live data.
