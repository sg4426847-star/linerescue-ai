# LineRescue AI — Implementation Plan

## Scope

Recreate LineRescue AI as a responsive, enterprise-grade supply-chain decision-support demo for SAP Hackfest Bengaluru 2026. The application will make synthetic inventory risk visible without claiming live SAP connectivity or autonomous inventory changes.

## Design direction

Three candidate styles considered:

- **Control-room noir** (0.07): dense operational dashboard with dark surfaces, cyan signals, and restrained status color.
- **Blueprint operations** (0.06): technical planning interface with blueprint lines, structured panels, and analytical annotations.
- **Quiet enterprise glass** (0.08): spacious glassmorphism cards with soft blue accents and low visual noise.

Chosen style: **Control-room noir**.

- **Design Movement:** contemporary enterprise control-room UI with editorial dashboard composition.
- **Core Principles:** decision clarity first; every risk has a reason; demo/live boundaries stay explicit; high signal, low decoration.
- **Color Philosophy:** deep navy surfaces create focus and trust; cyan marks verified flow and interaction; amber flags attention; coral marks hard stops; muted slate carries secondary context.
- **Layout Paradigm:** a fixed rail anchors navigation while each route uses an asymmetric command header, KPI strip, and evidence panels rather than a generic centered card grid.
- **Signature Elements:** cyan route rail; thin signal-line dividers; compact status pills that pair a state with an evidence label.
- **Interaction Philosophy:** every control should change a decision output, reveal evidence, or move the planner to the next action. No decorative controls.
- **Animation:** short, quiet transitions for panels and status changes; no looping motion; map pulses only on explicit evaluation.
- **Typography System:** Inter/system UI for navigation and body; monospace numerals for quantities, IDs, timestamps, and formula output.
- **Brand Essence:** LineRescue AI helps supply-chain planners choose safer recovery actions before a shortage becomes a cascade. Personality: analytical, protective, direct.
- **Brand Voice:** headlines name the operational decision; CTAs describe the next useful action. Example lines: “Stop a shortage from moving upstream.” and “Run the transfer through the guardrails.”
- **Wordmark & Logo:** a compact line-and-node mark beside the LineRescue wordmark, suggesting a supply lane being stabilized.
- **Signature Brand Color:** electric cyan `#39E6D0`, reserved for verified data and primary actions.

## Implementation approach

- Keep the existing React/TypeScript/Vite/Express starter and use Wouter for the eight requested routes.
- Put the synthetic inventory model and deterministic validation logic in `client/src/lib/lineRescue.ts` so the simulator, cockpit, recovery page, impact map, and receipt all share the same calculations.
- Use a shared shell in `client/src/components/LineRescueShell.tsx` and route-specific composition in `client/src/pages/LineRescue.tsx`.
- Use local React state for What-if inputs and receipt generation. The receipt is an in-memory, exportable record; the UI will not claim permanent audit storage.
- Add a read-only server-side SAP status/material-stock adapter scaffold under `/api/sap/*`. It will return an explicit pending/unconfigured state unless secure server environment variables are present; it will never write inventory or expose credentials.
- Add `.env.example`, `client/public/manus-routes.json`, and `app.config.ts` metadata.
- Use server mode so the secure adapter and health endpoint can ship together. No database is required for the recreated demo.

## Project structure

- `client/src/App.tsx`: route registration and providers.
- `client/src/components/LineRescueShell.tsx`: persistent rail, top bar, and shared visual primitives.
- `client/src/lib/lineRescue.ts`: demo data, formulae, deterministic validator, recovery options, receipt helpers.
- `client/src/pages/LineRescue.tsx`: Executive Cockpit and the seven supporting route views.
- `client/src/index.css`: dark control-room theme, responsive layout, chart/map primitives, states.
- `server/_core/index.ts`: health endpoint plus read-only SAP adapter endpoints.
- `client/public/manus-routes.json`: declared route manifest.
- `.env.example`: placeholder-only SAP configuration.

## Complete build workflow

1. Replace the starter example page with the shared shell and route views.
2. Add deterministic tests for safe-stock boundaries, unknown downstream data, and scenario recomputation.
3. Run `pnpm check`, `pnpm test`, and `pnpm build`.
4. Start the development server on the configured port and verify `/api/health` and `/manus-routes.json`.
5. Capture a desktop and mobile preview for visual inspection.
6. Commit the implementation to the canonical repository, then publish only after build and route checks pass.
