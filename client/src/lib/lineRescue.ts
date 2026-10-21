export type ValidationStatus = "approved" | "review" | "rejected";
export type DataConfidence = "confirmed" | "inferred" | "unknown";

export type Scenario = {
  sourceOnHand: number;
  reserved: number;
  committed: number;
  safetyStock: number;
  transferQty: number;
  destinationShortage: number;
  leadTimeDays: number;
  requiredArrivalDays: number;
};

export type ConstraintResult = {
  label: string;
  value: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export type Evaluation = {
  scenario: Scenario;
  transferableStock: number;
  remainingAfterTransfer: number;
  coverage: number;
  status: ValidationStatus;
  confidence: DataConfidence;
  riskLabel: string;
  reasons: string[];
  warnings: string[];
  constraints: ConstraintResult[];
  downstream: {
    available: boolean;
    dependentLocation: string;
    commitment: number;
    remainingRequirement: number;
    detail: string;
  };
};

export type RecoveryOption = {
  id: string;
  name: string;
  source: string;
  destination: string;
  quantity: number;
  arrival: string;
  leadTimeDays: number;
  cost: number | null;
  status: ValidationStatus;
  risk: string;
  confidence: DataConfidence;
  detail: string;
  downstream: string;
};

export type DecisionReceipt = {
  scenarioId: string;
  evaluatedAt: string;
  source: "Synthetic demo data" | "SAP read-only API";
  inputs: Scenario;
  calculation: {
    formula: string;
    transferableStock: number;
    remainingAfterTransfer: number;
    coverage: number;
  };
  constraints: ConstraintResult[];
  validation: {
    status: ValidationStatus;
    risk: string;
    reasons: string[];
    warnings: string[];
  };
  downstream: Evaluation["downstream"];
  options: RecoveryOption[];
  recommendation: string;
  limitations: string[];
};

export const ORIGINAL_SCENARIO: Scenario = {
  sourceOnHand: 860,
  reserved: 180,
  committed: 220,
  safetyStock: 300,
  transferQty: 120,
  destinationShortage: 120,
  leadTimeDays: 1,
  requiredArrivalDays: 2,
};

export const locations = [
  { id: "hosur", name: "Hosur Plant", city: "Hosur", role: "Source", x: 25, y: 57, tone: "cyan" },
  { id: "bengaluru", name: "Bengaluru DC", city: "Bengaluru", role: "Shortage", x: 53, y: 40, tone: "coral" },
  { id: "pune", name: "Pune Buffer Hub", city: "Pune", role: "Buffer", x: 76, y: 26, tone: "violet" },
  { id: "chennai", name: "Chennai Assembly", city: "Chennai", role: "Downstream", x: 78, y: 72, tone: "amber" },
];

export const formatQty = (value: number) => new Intl.NumberFormat("en-IN").format(Math.max(0, Math.round(value)));
export const formatCurrency = (value: number | null) => value === null ? "—" : `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`;
export const statusLabel = (status: ValidationStatus) => ({ approved: "Approved", review: "Review", rejected: "Rejected" })[status];

export function calculateTransferableStock(scenario: Scenario) {
  return Math.max(0, scenario.sourceOnHand - scenario.reserved - scenario.committed - scenario.safetyStock);
}

export function evaluateScenario(scenario: Scenario, downstreamAvailable = true): Evaluation {
  const transferableStock = calculateTransferableStock(scenario);
  const remainingAfterTransfer = Math.max(0, transferableStock - scenario.transferQty);
  const coverage = scenario.destinationShortage === 0 ? 100 : Math.min(100, Math.round((scenario.transferQty / scenario.destinationShortage) * 100));
  const reasons: string[] = [];
  const warnings: string[] = [];
  const downstreamCommitment = 40;
  const downstreamRequirement = downstreamAvailable ? downstreamCommitment : 0;
  const constraints: ConstraintResult[] = [];

  const sourcePass = scenario.transferQty <= transferableStock;
  constraints.push({
    label: "Transferable stock",
    value: `${formatQty(transferableStock)} units`,
    status: sourcePass ? "pass" : "fail",
    detail: sourcePass
      ? `Requested ${formatQty(scenario.transferQty)} stays within the verified free stock.`
      : `Requested ${formatQty(scenario.transferQty)} exceeds free stock by ${formatQty(scenario.transferQty - transferableStock)}.`,
  });
  if (!sourcePass) reasons.push("The proposed transfer is larger than the source's verified transferable stock.");

  const destinationPass = scenario.transferQty >= scenario.destinationShortage;
  constraints.push({
    label: "Destination coverage",
    value: `${formatQty(coverage)}% covered`,
    status: destinationPass ? "pass" : "warn",
    detail: destinationPass ? "The proposed quantity covers the reported Bengaluru shortage." : "The proposed quantity only partially covers the reported Bengaluru shortage.",
  });
  if (!destinationPass) warnings.push("The transfer would reduce, but not fully close, the destination shortage.");

  const compatibilityPass = scenario.transferQty <= 180;
  constraints.push({
    label: "Material compatibility",
    value: compatibilityPass ? "Compatible" : "Verify material",
    status: compatibilityPass ? "pass" : "fail",
    detail: compatibilityPass ? "Material family LR-42 is compatible across the demo lane." : "The demo lane capacity and compatibility threshold is 180 units.",
  });
  if (!compatibilityPass) reasons.push("The proposed quantity exceeds the verified demo lane compatibility threshold.");

  const timingPass = scenario.leadTimeDays <= scenario.requiredArrivalDays;
  constraints.push({
    label: "Arrival window",
    value: `${scenario.leadTimeDays}d / ${scenario.requiredArrivalDays}d`,
    status: timingPass ? "pass" : "fail",
    detail: timingPass ? "The lane arrives within the required recovery window." : "The lane misses the required arrival window.",
  });
  if (!timingPass) reasons.push("The estimated lane lead time misses the required arrival date.");

  let downstreamStatus: ConstraintResult["status"] = "pass";
  if (!downstreamAvailable) {
    downstreamStatus = "warn";
    warnings.push("Risk unknown — insufficient data. Downstream commitment data is not available.");
  } else if (remainingAfterTransfer < downstreamRequirement) {
    downstreamStatus = "fail";
    reasons.push(`The transfer would leave ${formatQty(remainingAfterTransfer)} units against a ${formatQty(downstreamRequirement)}-unit downstream commitment.`);
  }
  constraints.push({
    label: "Downstream commitments",
    value: downstreamAvailable ? `${formatQty(downstreamRequirement)} units known` : "Unknown",
    status: downstreamStatus,
    detail: downstreamAvailable ? "Known Chennai Assembly commitment is included in the check." : "No verified downstream commitment snapshot was supplied.",
  });

  const status: ValidationStatus = reasons.length > 0 ? "rejected" : warnings.length > 0 ? "review" : "approved";
  const confidence: DataConfidence = !downstreamAvailable ? "unknown" : warnings.length > 0 ? "inferred" : "confirmed";
  const riskLabel = status === "approved" ? "Low transfer risk" : status === "review" ? "Needs planner review" : "Unsafe transfer";

  return {
    scenario,
    transferableStock,
    remainingAfterTransfer,
    coverage,
    status,
    confidence,
    riskLabel,
    reasons,
    warnings,
    constraints,
    downstream: {
      available: downstreamAvailable,
      dependentLocation: "Chennai Assembly",
      commitment: downstreamCommitment,
      remainingRequirement: remainingAfterTransfer,
      detail: downstreamAvailable
        ? `The source retains ${formatQty(remainingAfterTransfer)} units after the proposed move.`
        : "Downstream commitments were not included in the available snapshot.",
    },
  };
}

export function buildRecoveryOptions(scenario: Scenario): RecoveryOption[] {
  const hosur = evaluateScenario(scenario, true);
  const bufferScenario: Scenario = {
    ...scenario,
    sourceOnHand: 420,
    reserved: 50,
    committed: 60,
    safetyStock: 180,
    transferQty: Math.min(scenario.transferQty, 80),
    leadTimeDays: 2,
  };
  const buffer = evaluateScenario(bufferScenario, false);
  const waitStatus: ValidationStatus = scenario.requiredArrivalDays < 4 ? "rejected" : "approved";

  return [
    {
      id: "hosur-transfer",
      name: "Transfer from Hosur",
      source: "Hosur Plant",
      destination: "Bengaluru DC",
      quantity: scenario.transferQty,
      arrival: "Tomorrow · 09:00",
      leadTimeDays: scenario.leadTimeDays,
      cost: 4200,
      status: hosur.status,
      risk: hosur.riskLabel,
      confidence: hosur.confidence,
      detail: hosur.status === "approved" ? "Covers the shortage while preserving known downstream commitments." : hosur.reasons[0] ?? hosur.warnings[0] ?? "Planner review required.",
      downstream: hosur.downstream.detail,
    },
    {
      id: "pune-buffer",
      name: "Use Pune Buffer Hub",
      source: "Pune Buffer Hub",
      destination: "Bengaluru DC",
      quantity: bufferScenario.transferQty,
      arrival: "In 2 days · 14:00",
      leadTimeDays: 2,
      cost: 5600,
      status: buffer.status,
      risk: buffer.riskLabel,
      confidence: buffer.confidence,
      detail: `Covers ${formatQty(buffer.coverage)}% of the shortage; downstream commitment data is unknown, so planner review is required.`,
      downstream: buffer.downstream.detail,
    },
    {
      id: "wait-replenishment",
      name: "Wait for replenishment",
      source: "Confirmed supplier inbound",
      destination: "Bengaluru DC",
      quantity: scenario.destinationShortage,
      arrival: "In 4 days · ETA pending",
      leadTimeDays: 4,
      cost: null,
      status: waitStatus,
      risk: waitStatus === "approved" ? "Low inventory risk" : "Misses required window",
      confidence: "inferred",
      detail: waitStatus === "approved" ? "Replenishment is compatible with the requested window." : "The current required arrival window is earlier than the inbound ETA.",
      downstream: "No source stock is consumed; production remains exposed until arrival.",
    },
  ];
}

export function createDecisionReceipt(scenario: Scenario, downstreamAvailable = true, evaluatedAt = new Date().toISOString()): DecisionReceipt {
  const evaluation = evaluateScenario(scenario, downstreamAvailable);
  const options = buildRecoveryOptions(scenario);
  const best = options.find(option => option.status === "approved") ?? options.find(option => option.status === "review") ?? options[0];
  return {
    scenarioId: `LR-${evaluatedAt.replace(/[-:TZ.]/g, "").slice(0, 14)}`,
    evaluatedAt,
    source: "Synthetic demo data",
    inputs: scenario,
    calculation: {
      formula: "max(0, on-hand − reserved − committed − safety stock)",
      transferableStock: evaluation.transferableStock,
      remainingAfterTransfer: evaluation.remainingAfterTransfer,
      coverage: evaluation.coverage,
    },
    constraints: evaluation.constraints,
    validation: {
      status: evaluation.status,
      risk: evaluation.riskLabel,
      reasons: evaluation.reasons,
      warnings: evaluation.warnings,
    },
    downstream: evaluation.downstream,
    options,
    recommendation: best ? `${best.name}: ${best.detail}` : "No feasible option is available.",
    limitations: [
      "All inventory, cost, lane, and location values are synthetic demo data.",
      "The receipt is held in memory for this session and is not a permanent audit record.",
      "SAP read-only access is pending tenant configuration and an authorized connection test.",
    ],
  };
}
