import { describe, expect, it } from "vitest";
import { buildRecoveryOptions, evaluateScenario, ORIGINAL_SCENARIO } from "./lineRescue";
import { demoEstimateLabel, downstreamPosture, optionStatusCounts, optionStatusSummary, syntheticKpiLabel, syntheticNetworkLabel, validationCopy } from "./cockpitPresentation";

describe("LineRescue cockpit presentation", () => {
  it("uses changed simulator inputs in the same formula evaluation", () => {
    const changed = { ...ORIGINAL_SCENARIO, sourceOnHand: 1000, reserved: 100, committed: 200, safetyStock: 300 };
    const evaluation = evaluateScenario(changed, true);
    expect(evaluation.scenario).toMatchObject({ sourceOnHand: 1000, reserved: 100, committed: 200, safetyStock: 300 });
    expect(evaluation.transferableStock).toBe(400);
  });

  it.each([
    ["approved", "Transfer is safe under the current assumptions.", "OK"],
    ["review", "Transfer needs planner review.", "REVIEW"],
    ["rejected", "Transfer blocked by a hard constraint.", "BLOCKED"],
  ] as const)("uses distinct validation wording for %s", (status, headline, label) => {
    const evaluation = evaluateScenario(
      status === "review" ? { ...ORIGINAL_SCENARIO, transferQty: 60 } : status === "rejected" ? { ...ORIGINAL_SCENARIO, transferQty: 200 } : ORIGINAL_SCENARIO,
      true,
    );
    expect(evaluation.status).toBe(status);
    expect(validationCopy(evaluation)).toMatchObject({ headline, statusLabel: label });
  });

  it("shows downstream at risk or unknown instead of claiming protected", () => {
    const atRisk = downstreamPosture(evaluateScenario({ ...ORIGINAL_SCENARIO, transferQty: 140 }, true));
    const unknown = downstreamPosture(evaluateScenario(ORIGINAL_SCENARIO, false));
    expect(atRisk).toMatchObject({ label: "At risk", tone: "coral" });
    expect(unknown).toMatchObject({ label: "Unknown — insufficient data", tone: "amber" });
  });

  it("counts every recovery status separately and never folds rejected into review", () => {
    const originalCounts = optionStatusCounts(buildRecoveryOptions(ORIGINAL_SCENARIO));
    const delayedCounts = optionStatusCounts(buildRecoveryOptions({ ...ORIGINAL_SCENARIO, requiredArrivalDays: 4 }));
    expect(originalCounts).toEqual({ total: 3, approved: 1, review: 1, rejected: 1 });
    expect(delayedCounts).toEqual({ total: 3, approved: 2, review: 1, rejected: 0 });
  });

  it("formats the cockpit summary with the required labels and omits zero statuses", () => {
    expect(optionStatusSummary(buildRecoveryOptions(ORIGINAL_SCENARIO))).toBe("1 feasible · 1 needs review · 1 not feasible");
    expect(optionStatusSummary(buildRecoveryOptions({ ...ORIGINAL_SCENARIO, requiredArrivalDays: 4 }))).toBe("2 feasible · 1 needs review");
  });

  it("keeps synthetic KPI, network, ETA, and cost disclosures available", () => {
    expect(syntheticKpiLabel).toContain("not live telemetry");
    expect(syntheticNetworkLabel).toContain("Synthetic illustrative network");
    expect(demoEstimateLabel).toContain("not live logistics data");
    const option = buildRecoveryOptions(ORIGINAL_SCENARIO)[0];
    expect(option.cost).toBe(4200);
    expect(option.arrival).toContain("Tomorrow");
  });
});
