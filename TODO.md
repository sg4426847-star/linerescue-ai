# LineRescue AI — Outcomes

## Executive Cockpit and navigation

- [ ] The first screen is an Executive Cockpit that explains the inventory shortage problem and available recovery actions.
- [ ] The application preserves these routes: `/`, `/simulator`, `/recovery`, `/impact`, `/audit`, `/data`, `/sap`, and `/business`.
- [ ] Navigation links, page actions, filters, scenario controls, and export actions work as advertised.
- [ ] The interface is responsive for laptop, tablet, and mobile widths, with readable contrast and clear loading, empty, success, warning, and error states.

## SafeStock validation and ripple risk

- [ ] Transferable stock is calculated as `max(0, on-hand stock − reserved stock − committed stock − safety stock)`.
- [ ] A proposed transfer above verified transferable stock is rejected or flagged with a plain-language reason.
- [ ] The engine considers source availability, reserved and committed inventory, safety stock, destination shortage, compatibility, lane capacity, lead time, downstream commitments, and data quality where available.
- [ ] Missing data is not silently treated as zero; unknown downstream data produces `Risk unknown — insufficient data`.
- [ ] The risk rules are deterministic, testable, and explainable, and are not described as machine learning.

## Recovery planner and decision receipt

- [ ] Recovery compares synthetic Hosur transfer, synthetic Pune Buffer Hub, and wait-for-replenishment options.
- [ ] Each option shows quantity, source/destination, timing, synthetic cost where applicable, inventory risk, downstream effects, validation status, and reasons.
- [ ] Infeasible plans are never labelled safe; when no plan is feasible, the UI explains missing information or operational next steps.
- [ ] Each evaluated scenario produces an in-memory explainable receipt with ID, timestamp, inputs, calculations, constraints, results, warnings, impact, options, recommendation, and limitations.
- [ ] Audit/export reflects the actual current engine output and does not claim permanent storage.

## What-if simulator

- [ ] Users can change transfer quantity, destination shortage, source available stock, safety stock, and lead time.
- [ ] Changing an input reruns the actual validation logic and refreshes the recovery options and receipt.
- [ ] Users can restore the original demo scenario and see clear warnings for unsafe or unknown outcomes.

## Impact, data, SAP, and business views

- [ ] Impact Map visualizes synthetic locations and supported supply relationships and labels the network as demo data.
- [ ] Data and Assumptions documents demo sources, assumptions, formulae, rules, uncertain information, synthetic costs/lead times, and limitations.
- [ ] SAP Architecture shows the intended read-only architecture and labels integration as pending/unavailable until a real authorized request succeeds.
- [ ] The server exposes a read-only SAP adapter scaffold that keeps credentials server-side, handles missing configuration and API failures, and never mutates SAP inventory.
- [ ] Business Value describes expected benefits without claiming measured savings, performance improvements, or adoption.

## Verification and delivery

- [ ] `pnpm check` passes.
- [ ] `pnpm test` passes with formula boundary, zero transferable stock, valid/invalid transfer, unknown data, and recomputation coverage.
- [ ] `pnpm build` passes.
- [ ] `/api/health` responds successfully and `/manus-routes.json` lists all eight page routes.
- [ ] The implementation is committed to the canonical repository before publication.
