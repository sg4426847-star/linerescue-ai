import { describe, expect, it } from "vitest";
import {
  buildRecoveryOptions,
  calculateTransferableStock,
  ORIGINAL_SCENARIO,
  evaluateScenario,
} from "./lineRescue";

describe("LineRescue safe-stock rules", () => {
  it("calculates transferable stock with protected inventory excluded", () => {
    expect(calculateTransferableStock(ORIGINAL_SCENARIO)).toBe(160);
  });

  it("never returns negative transferable stock", () => {
    expect(calculateTransferableStock({ ...ORIGINAL_SCENARIO, sourceOnHand: 100 })).toBe(0);
  });

  it("approves a valid transfer inside the verified balance", () => {
    const evaluation = evaluateScenario(ORIGINAL_SCENARIO, true);
    expect(evaluation.status).toBe("approved");
    expect(evaluation.remainingAfterTransfer).toBe(40);
    expect(evaluation.coverage).toBe(100);
  });

  it("rejects a transfer that exceeds transferable stock", () => {
    const evaluation = evaluateScenario({ ...ORIGINAL_SCENARIO, transferQty: 161 }, true);
    expect(evaluation.status).toBe("rejected");
    expect(evaluation.reasons.join(" ")).toContain("larger than the source's verified transferable stock");
  });

  it("marks missing downstream data as unknown instead of safe", () => {
    const evaluation = evaluateScenario(ORIGINAL_SCENARIO, false);
    expect(evaluation.status).toBe("review");
    expect(evaluation.riskLabel).toBe("Needs planner review");
    expect(evaluation.warnings.join(" ")).toContain("Risk unknown — insufficient data");
  });

  it("recomputes recovery options from changed scenario inputs", () => {
    const original = buildRecoveryOptions(ORIGINAL_SCENARIO);
    const changed = buildRecoveryOptions({ ...ORIGINAL_SCENARIO, transferQty: 60, destinationShortage: 60 });
    expect(original[0].quantity).toBe(120);
    expect(changed[0].quantity).toBe(60);
    expect(changed[0].status).toBe("approved");
  });

  it("keeps the Pune buffer option in review because coverage is partial and downstream data is unknown", () => {
    const option = buildRecoveryOptions(ORIGINAL_SCENARIO)[1];
    expect(option.status).toBe("review");
    expect(option.quantity).toBe(80);
    expect(option.detail).toContain("Covers 67% of the shortage");
    expect(option.downstream).toContain("not included");
  });

  it("rejects waiting for replenishment when its four-day ETA misses the two-day window", () => {
    const option = buildRecoveryOptions(ORIGINAL_SCENARIO)[2];
    expect(option.status).toBe("rejected");
    expect(option.leadTimeDays).toBe(4);
    expect(option.detail).toContain("earlier than the inbound ETA");
  });
});
