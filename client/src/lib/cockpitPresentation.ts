import type { Evaluation, RecoveryOption } from "./lineRescue";

export type ValidationCopy = {
  headline: string;
  detail: string;
  statusLabel: string;
};

export function validationCopy(evaluation: Evaluation): ValidationCopy {
  if (evaluation.status === "approved") {
    return {
      headline: "Transfer is safe under the current assumptions.",
      detail: "The proposed move passes the source, compatibility, timing, and known downstream checks.",
      statusLabel: "OK",
    };
  }
  if (evaluation.status === "review") {
    return {
      headline: "Transfer needs planner review.",
      detail: evaluation.warnings[0] ?? "One or more checks need evidence before approval.",
      statusLabel: "REVIEW",
    };
  }
  return {
    headline: "Transfer blocked by a hard constraint.",
    detail: evaluation.reasons[0] ?? "The proposed move cannot be approved under the current assumptions.",
    statusLabel: "BLOCKED",
  };
}

export function downstreamPosture(evaluation: Evaluation): {
  label: string;
  tone: "green" | "coral" | "amber";
  commitmentLabel: string;
} {
  if (!evaluation.downstream.available) {
    return { label: "Unknown — insufficient data", tone: "amber", commitmentLabel: "Commitment unknown" };
  }
  const protectedDownstream = evaluation.remainingAfterTransfer >= evaluation.downstream.commitment;
  return {
    label: protectedDownstream ? "Protected" : "At risk",
    tone: protectedDownstream ? "green" : "coral",
    commitmentLabel: `Known commitment · ${evaluation.downstream.commitment} units`,
  };
}

export function optionStatusCounts(options: RecoveryOption[]) {
  return {
    approved: options.filter(option => option.status === "approved").length,
    review: options.filter(option => option.status === "review").length,
    rejected: options.filter(option => option.status === "rejected").length,
    total: options.length,
  };
}

export function optionStatusSummary(options: RecoveryOption[]) {
  const counts = optionStatusCounts(options);
  return [
    counts.approved > 0 ? `${counts.approved} feasible` : null,
    counts.review > 0 ? `${counts.review} needs review` : null,
    counts.rejected > 0 ? `${counts.rejected} not feasible` : null,
  ].filter(Boolean).join(" · ");
}

export const syntheticKpiLabel = "Synthetic demo indicators · illustrative, not live telemetry";
export const syntheticNetworkLabel = "Synthetic illustrative network";
export const demoEstimateLabel = "Demo estimate · not live logistics data";
