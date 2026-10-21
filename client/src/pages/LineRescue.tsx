import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  CloudOff,
  Download,
  ExternalLink,
  FileJson,
  Info,
  LockKeyhole,
  Map as MapIcon,
  MapPin,
  Minus,
  Package,
  RefreshCw,
  ScanSearch,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  Truck,
  Waypoints,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  buildRecoveryOptions,
  calculateTransferableStock,
  createDecisionReceipt,
  formatCurrency,
  formatQty,
  ORIGINAL_SCENARIO,
  evaluateScenario,
  locations,
  statusLabel,
  type DecisionReceipt,
  type RecoveryOption,
  type Scenario,
  type ValidationStatus,
} from "@/lib/lineRescue";
import { demoEstimateLabel, downstreamPosture, optionStatusCounts, optionStatusSummary, syntheticKpiLabel, syntheticNetworkLabel, validationCopy } from "@/lib/cockpitPresentation";
import { InlineAction, LineRescueShell, PageHeader, Panel, SectionEyebrow, StatCard, StatusPill } from "@/components/LineRescueShell";

const cloneScenario = () => ({ ...ORIGINAL_SCENARIO });

function statusTone(status: ValidationStatus) {
  return status === "approved" ? "green" : status === "review" ? "amber" : "coral";
}

function StatusIcon({ status }: { status: ValidationStatus }) {
  if (status === "approved") return <CheckCircle2 size={15} />;
  if (status === "review") return <AlertTriangle size={15} />;
  return <X size={15} />;
}

function StatusBadge({ status, compact = false }: { status: ValidationStatus; compact?: boolean }) {
  return <StatusPill tone={statusTone(status)}><StatusIcon status={status} />{compact ? statusLabel(status) : statusLabel(status)}</StatusPill>;
}

function RiskBanner({ status, risk, detail }: { status: ValidationStatus; risk: string; detail: string }) {
  return <div className={`risk-banner ${statusTone(status)}`}><div className="risk-icon"><StatusIcon status={status} /></div><div><strong>{risk}</strong><span>{detail}</span></div><span className="risk-state">{status === "approved" ? "READY TO REVIEW" : status === "review" ? "PLANNER REVIEW" : "BLOCK TRANSFER"}</span></div>;
}

function ProgressBar({ value, tone = "cyan" }: { value: number; tone?: string }) {
  return <div className="progress-track"><span className={`progress-fill ${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

function FormulaCard({ evaluation }: { evaluation: ReturnType<typeof evaluateScenario> }) {
  const { sourceOnHand, reserved, committed, safetyStock } = evaluation.scenario;
  return <div className="formula-card"><div className="formula-label">TRANSFERABLE STOCK CHECK</div><div className="formula-line"><span>{formatQty(sourceOnHand)}</span><Minus size={13} /><span>{formatQty(reserved)}</span><Minus size={13} /><span>{formatQty(committed)}</span><Minus size={13} /><span>{formatQty(safetyStock)}</span><span className="formula-equals">=</span><strong>{formatQty(evaluation.transferableStock)}</strong><small>units free</small></div><div className="formula-foot"><span>on-hand</span><span>reserved</span><span>committed</span><span>safety stock</span><span className="formula-spacer" /><span className="mono">max(0, …)</span></div></div>;
}

function MiniSparkline({ tone = "cyan" }: { tone?: string }) {
  return <div className={`mini-sparkline ${tone}`}><span style={{ height: "28%" }} /><span style={{ height: "42%" }} /><span style={{ height: "36%" }} /><span style={{ height: "62%" }} /><span style={{ height: "54%" }} /><span style={{ height: "78%" }} /><span style={{ height: "68%" }} /><span style={{ height: "86%" }} /></div>;
}

function SupplyNetworkGraphic() {
  return <div className="hero-network" aria-label={syntheticNetworkLabel}>
    <div className="hero-network-grid" />
    <svg viewBox="0 0 520 250" preserveAspectRatio="none" className="hero-network-lines"><path d="M88 150 C155 113 178 78 250 105 S365 158 430 98" /><path d="M88 150 C160 182 178 216 275 190 S362 126 430 98" /><path d="M250 105 C286 76 320 64 356 73" /></svg>
    <div className="hero-network-node source" style={{ left: "15%", top: "60%" }}><div><Truck size={14} /></div><span>Hosur Plant</span></div>
    <div className="hero-network-node destination" style={{ left: "48%", top: "42%" }}><div><Package size={14} /></div><span>Bengaluru DC</span></div>
    <div className="hero-network-node buffer" style={{ left: "79%", top: "30%" }}><div><Boxes size={14} /></div><span>Pune Buffer</span></div>
    <div className="hero-network-node downstream" style={{ left: "67%", top: "77%" }}><div><ShieldCheck size={14} /></div><span>Protected</span></div>
    <span className="hero-network-chip chip-one">14 units</span><span className="hero-network-chip chip-two">safe lane</span><span className="hero-network-chip chip-three">LR-42</span><span className="hero-network-disclaimer">{syntheticNetworkLabel}</span>
  </div>;
}

function Cockpit({ receipt, evaluation, onOpenReceipt }: { receipt: DecisionReceipt; evaluation: ReturnType<typeof evaluateScenario>; onOpenReceipt: () => void }) {
  const options = receipt.options;
  const optionCounts = optionStatusCounts(options);
  const copy = validationCopy(evaluation);
  const downstream = downstreamPosture(evaluation);
  return <>
    <section className="cockpit-hero"><div className="cockpit-hero-copy"><SectionEyebrow><Sparkles size={14} />LINERESCUE AI · SAFESTOCK VALIDATOR</SectionEyebrow><h1>Save one production line without disrupting another.</h1><p>Validate every proposed inventory transfer against commitments, safety stock, compatibility, deadlines, and downstream orders before a human planner approves the action.</p><div className="cockpit-hero-actions"><Link href="/simulator" className="button button-primary"><SlidersIcon />Launch Simulator<ArrowRight size={16} /></Link><Link href="/impact" className="button button-hero-ghost"><MapIcon size={15} />Explore Impact Map</Link></div></div><SupplyNetworkGraphic /></section>
    <div className="demo-strip"><div className="demo-strip-icon"><Sparkles size={16} /></div><div><strong>Synthetic demo records</strong><span>SafeStock engine ready · no live SAP credentials connected</span></div><div className="demo-strip-location"><MapPin size={14} /> Synthetic network · India South</div></div>
    <div className="validation-highlight"><div><SectionEyebrow icon={ShieldCheck}>CURRENT VALIDATION · {evaluation.status === "approved" ? "SAFE TRANSFER" : evaluation.status === "review" ? "PLANNER REVIEW" : "TRANSFER BLOCKED"}</SectionEyebrow><h2>{copy.headline}</h2><p>{copy.detail} Destination shortage is <strong>{formatQty(receipt.inputs.destinationShortage)} units</strong>; proposed transfer is <strong>{formatQty(receipt.inputs.transferQty)} LR-42 units.</strong></p></div><div className="validation-status-card"><span>VALIDATION STATUS</span><StatusBadge status={evaluation.status} /><strong>{copy.statusLabel}</strong><small>deterministic</small><p>Hard constraints are evaluated before any recovery ranking.</p></div></div>
    <div className="stats-grid">
      <StatCard label="Destination shortage" value={<>{formatQty(receipt.inputs.destinationShortage)} <small>units</small></>} detail="Bengaluru DC · LR-42" tone="coral" icon={Package} />
      <StatCard label="Transferable stock" value={<>{formatQty(evaluation.transferableStock)} <small>units</small></>} detail="Hosur Plant after guardrails" tone="cyan" icon={ShieldCheck} />
      <StatCard label="Recovery window" value={<>{receipt.inputs.requiredArrivalDays} <small>days</small></>} detail={`Lane estimate · ${receipt.inputs.leadTimeDays} day`} tone="amber" icon={Clock3} />
      <StatCard label="Options evaluated" value={<>{optionCounts.total} <small>paths</small></>} detail={optionStatusSummary(options)} tone="violet" icon={Waypoints} />
    </div>
    <div className="content-grid two-thirds">
      <Panel title="Recommended action" eyebrow="DECISION SIGNAL" action={<StatusBadge status={evaluation.status} />}>
        <RiskBanner status={evaluation.status} risk={evaluation.riskLabel} detail={evaluation.status === "approved" ? `Move ${formatQty(receipt.inputs.transferQty)} units from Hosur to Bengaluru and keep the downstream check attached.` : evaluation.reasons[0] ?? evaluation.warnings[0] ?? "Planner review required before execution."} />
        <div className="recommendation-row"><div className="route-flow"><div className="route-node"><span className="node-label">SOURCE</span><strong>Hosur Plant</strong><small>{formatQty(evaluation.transferableStock)} units free</small></div><div className="route-arrow"><Truck size={17} /><span>{receipt.inputs.leadTimeDays} day</span></div><div className="route-node coral"><span className="node-label">DESTINATION</span><strong>Bengaluru DC</strong><small>{formatQty(receipt.inputs.destinationShortage)} units short</small></div></div><div className="recommendation-cta"><button className="button button-ghost" onClick={onOpenReceipt}><FileJson size={15} />Open receipt</button><Link href="/recovery" className="button button-primary">Compare plans<ArrowRight size={15} /></Link></div></div>
      </Panel>
      <Panel title="Stock posture" eyebrow="SOURCE GUARDRAILS"><FormulaCard evaluation={evaluation} /><div className="posture-list"><div><span>On-hand stock</span><strong>{formatQty(receipt.inputs.sourceOnHand)}</strong><ProgressBar value={100} /></div><div><span>Protected stock</span><strong>{formatQty(receipt.inputs.reserved + receipt.inputs.committed + receipt.inputs.safetyStock)}</strong><ProgressBar value={81} tone="amber" /></div><div><span>Proposed transfer</span><strong>{formatQty(receipt.inputs.transferQty)}</strong><ProgressBar value={(receipt.inputs.transferQty / Math.max(1, evaluation.transferableStock)) * 100} tone="violet" /></div></div></Panel>
    </div>
    <div className="content-grid three-columns"><Panel title="Network pulse" eyebrow={syntheticKpiLabel}><div className="pulse-row"><div><span className="metric-label">Open shortage signals · demo</span><strong>06</strong><small><ArrowDownRight size={12} /> 2 since yesterday · illustrative</small></div><MiniSparkline /></div><div className="pulse-footer"><span><i className="legend-dot cyan" />Source availability · demo</span><span><i className="legend-dot coral" />Shortage exposure · demo</span></div></Panel><Panel title="Ripple watch" eyebrow="DEPENDENT LOCATIONS"><div className="ripple-location"><div className="location-orb amber">CA</div><div><strong>Chennai Assembly</strong><span>{downstream.commitmentLabel}</span></div><StatusPill tone={downstream.tone}>{downstream.label}</StatusPill></div><div className="ripple-location"><div className="location-orb slate">—</div><div><strong>Pune Buffer Hub</strong><span>Downstream snapshot missing</span></div><StatusPill tone="amber">Unknown — insufficient data</StatusPill></div><InlineAction href="/impact">Open impact map</InlineAction></Panel><Panel title="Decision hygiene" eyebrow="EVIDENCE CHECK"><div className="check-list"><div><Check size={14} /><span>Stock calculation attached</span></div><div><Check size={14} /><span>Lane timing evaluated</span></div><div><Check size={14} /><span>Demo source labelled</span></div><div className="warning"><AlertTriangle size={14} /><span>SAP live connection pending</span></div></div><InlineAction href="/audit">Review audit receipt</InlineAction></Panel></div>
  </>;
}

function SlidersIcon() { return <SlidersHorizontalIcon />; }
function SlidersHorizontalIcon() { return <span className="button-icon"><SlidersHorizontal size={16} /></span>; }

function Simulator({ scenario, setScenario, evaluation, receipt, onReset, onExport }: { scenario: Scenario; setScenario: (scenario: Scenario) => void; evaluation: ReturnType<typeof evaluateScenario>; receipt: DecisionReceipt; onReset: () => void; onExport: () => void }) {
  const change = (key: keyof Scenario, value: string) => setScenario({ ...scenario, [key]: Number(value) });
  return <>
    <PageHeader eyebrow="SAFE STOCK VALIDATOR / 02" title="Run the transfer through the guardrails." description="Change one assumption at a time. The validator reruns the same deterministic rules and refreshes the risk, options, and receipt below." action={<button className="button button-ghost" onClick={onReset}><RefreshCw size={15} />Reset demo</button>} />
    <div className="simulator-layout"><Panel title="Scenario inputs" eyebrow="WHAT-IF LAB" action={<StatusPill tone="cyan">Live calculation</StatusPill>}><div className="input-grid"><InputField label="Source on-hand" value={scenario.sourceOnHand} suffix="units" onChange={value => change("sourceOnHand", value)} /><InputField label="Reserved stock" value={scenario.reserved} suffix="units" onChange={value => change("reserved", value)} /><InputField label="Committed stock" value={scenario.committed} suffix="units" onChange={value => change("committed", value)} /><InputField label="Safety stock" value={scenario.safetyStock} suffix="units" onChange={value => change("safetyStock", value)} /><InputField label="Transfer quantity" value={scenario.transferQty} suffix="units" onChange={value => change("transferQty", value)} tone="cyan" /><InputField label="Destination shortage" value={scenario.destinationShortage} suffix="units" onChange={value => change("destinationShortage", value)} tone="coral" /><InputField label="Lead time" value={scenario.leadTimeDays} suffix="days" onChange={value => change("leadTimeDays", value)} /><InputField label="Required arrival" value={scenario.requiredArrivalDays} suffix="days" onChange={value => change("requiredArrivalDays", value)} /></div><div className="input-note"><Info size={14} /><span>All values are synthetic demo inputs. Missing data is not silently assumed to be zero.</span></div></Panel><div className="simulator-side"><Panel title="Validation result" eyebrow="RULE ENGINE"><RiskBanner status={evaluation.status} risk={evaluation.riskLabel} detail={evaluation.reasons[0] ?? evaluation.warnings[0] ?? "All required checks passed for this scenario."} /><div className="validation-score"><div><span>Destination coverage</span><strong>{evaluation.coverage}%</strong></div><ProgressBar value={evaluation.coverage} tone={evaluation.status === "rejected" ? "coral" : "cyan"} /></div><div className="constraint-stack">{evaluation.constraints.map(constraint => <div key={constraint.label} className="constraint-row"><div className={`constraint-icon ${constraint.status}`}>{constraint.status === "pass" ? <Check size={13} /> : constraint.status === "warn" ? <AlertTriangle size={13} /> : <X size={13} />}</div><div><strong>{constraint.label}</strong><span>{constraint.detail}</span></div><b>{constraint.value}</b></div>)}</div></Panel><div className="simulator-actions"><button className="button button-primary" onClick={onExport}><Download size={15} />Export receipt</button><Link href="/recovery" className="button button-ghost">View options<ArrowRight size={15} /></Link></div></div></div>
    <Panel title="Calculation trace" eyebrow="EXPLAINABLE OUTPUT" action={<span className="mono muted">{receipt.scenarioId}</span>}><div className="trace-grid"><div className="trace-step"><span>01</span><div><strong>Free stock</strong><p>max(0, {formatQty(scenario.sourceOnHand)} − {formatQty(scenario.reserved)} − {formatQty(scenario.committed)} − {formatQty(scenario.safetyStock)})</p></div><b>{formatQty(evaluation.transferableStock)} units</b></div><div className="trace-step"><span>02</span><div><strong>Post-transfer balance</strong><p>{formatQty(evaluation.transferableStock)} free stock − {formatQty(scenario.transferQty)} proposed transfer</p></div><b>{formatQty(evaluation.remainingAfterTransfer)} units</b></div><div className="trace-step"><span>03</span><div><strong>Downstream posture</strong><p>{evaluation.downstream.detail}</p></div><b className={evaluation.downstream.available ? "good-text" : "warn-text"}>{evaluation.downstream.available ? "Checked" : "Unknown"}</b></div></div></Panel>
  </>;
}

function InputField({ label, value, suffix, onChange, tone = "slate" }: { label: string; value: number; suffix: string; onChange: (value: string) => void; tone?: string }) {
  return <label className={`input-field ${tone}`}><span>{label}</span><div><input type="number" min="0" value={value} onChange={event => onChange(event.target.value)} /><b>{suffix}</b></div></label>;
}

function Recovery({ options, scenario, onExport }: { options: RecoveryOption[]; scenario: Scenario; onExport: () => void }) {
  return <>
    <PageHeader eyebrow="MULTI-OPTION RECOVERY / 03" title="Compare the paths before you move stock." description="One shortage, three operational choices. The planner keeps feasibility, timing, risk, and data confidence in the same decision frame." action={<button className="button button-ghost" onClick={onExport}><Download size={15} />Export receipt</button>} />
    <div className="recovery-summary"><div><span className="summary-kicker">DECISION FRAME · SYNTHETIC DEMO</span><strong>{formatQty(scenario.destinationShortage)} units needed at Bengaluru DC</strong><p>Required arrival: within {scenario.requiredArrivalDays} days · Material LR-42 · {demoEstimateLabel}</p></div><div className="summary-route"><span>Hosur</span><ArrowRight size={16} /><span className="coral-text">Bengaluru</span><span className="route-status">{formatQty(scenario.destinationShortage)} shortage units · demo</span></div></div>
    <div className="option-stack">{options.map((option, index) => <RecoveryCard key={option.id} option={option} rank={index + 1} />)}</div>
    <div className="bottom-note"><Info size={15} /><span>Recommendation is calculated from the current simulator inputs. Options are synthetic and are not execution instructions.</span><Link href="/simulator">Adjust scenario <ArrowRight size={14} /></Link></div>
  </>;
}

function RecoveryCard({ option, rank }: { option: RecoveryOption; rank: number }) {
  const [expanded, setExpanded] = useState(rank === 1);
  return <article className={`recovery-card ${option.status === "approved" ? "featured" : ""}`}><div className="option-rank">0{rank}</div><div className="option-main"><div className="option-title-row"><div><div className="option-kicker">{option.status === "approved" ? "RECOMMENDED PATH" : option.status === "review" ? "ALTERNATIVE PATH" : "CONTINGENCY PATH"}</div><h2>{option.name}</h2></div><StatusBadge status={option.status} /></div><div className="option-route"><span>{option.source}</span><ArrowRight size={14} /><span>{option.destination}</span><span className="confidence-chip"><span className={`confidence-dot ${option.confidence}`} />{option.confidence} data</span></div><div className="option-metrics"><div><span>Quantity · synthetic</span><strong>{formatQty(option.quantity)} <small>units</small></strong></div><div><span>Arrival · {demoEstimateLabel}</span><strong>{option.arrival}</strong></div><div><span>Est. cost · demo</span><strong>{formatCurrency(option.cost)}</strong></div><div><span>Inventory risk</span><strong className={option.status === "approved" ? "good-text" : option.status === "review" ? "warn-text" : "bad-text"}>{option.risk}</strong></div></div><div className="option-detail"><div className="option-detail-icon">{option.status === "approved" ? <Check size={14} /> : option.status === "review" ? <AlertTriangle size={14} /> : <X size={14} />}</div><p>{option.detail}</p><button className="text-button" onClick={() => setExpanded(!expanded)}>{expanded ? "Hide evidence" : "Show evidence"}<ChevronDown size={14} className={expanded ? "rotate" : ""} /></button></div>{expanded && <div className="option-evidence"><div><span>Downstream effect</span><strong>{option.downstream}</strong></div><div><span>Lead time</span><strong>{option.leadTimeDays} days to destination</strong></div><div><span>Decision rule</span><strong>{option.status === "approved" ? "All required checks passed" : option.status === "review" ? "Planner review required" : "At least one hard constraint failed"}</strong></div></div>}</div></article>;
}

function Impact({ scenario, evaluation }: { scenario: Scenario; evaluation: ReturnType<typeof evaluateScenario> }) {
  const downstreamProtected = evaluation.downstream.available && evaluation.remainingAfterTransfer >= evaluation.downstream.commitment;
  return <><PageHeader eyebrow="SUPPLY-CHAIN IMPACT MAP / 04" title="See where a recovery action can ripple." description="A synthetic network view of the locations and relationships included in the current scenario. The map shows supported evidence, not inferred certainty." action={<StatusPill tone="violet">Demo network</StatusPill>} /><div className="impact-layout"><Panel title="Network topology" eyebrow="SYNTHETIC DEMO DATA"><div className="impact-map"><div className="map-grid" /><svg className="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M25 57 C36 52, 43 44, 53 40" /><path d="M53 40 C60 34, 68 29, 76 26" /><path d="M53 40 C62 52, 71 65, 78 72" /><path d="M25 57 C43 61, 62 68, 78 72" /></svg>{locations.map(location => <div key={location.id} className={`map-node ${location.tone}`} style={{ left: `${location.x}%`, top: `${location.y}%` }}><div className="map-node-core"><MapPin size={16} /></div><div className="map-node-label"><strong>{location.city}</strong><span>{location.role}</span></div></div>)}<div className="map-legend"><span><i className="legend-dot cyan" />Source</span><span><i className="legend-dot coral" />Shortage</span><span><i className="legend-dot amber" />Downstream</span><span><i className="legend-dot violet" />Buffer</span></div></div></Panel><div className="impact-aside"><Panel title="Affected locations" eyebrow="CURRENT SCENARIO"><div className="affected-list"><div className="affected-row"><div className="location-orb coral">BLR</div><div><strong>Bengaluru DC</strong><span>Shortage · {formatQty(scenario.destinationShortage)} units</span></div><StatusPill tone="coral">Immediate</StatusPill></div><div className="affected-row"><div className="location-orb amber">CHE</div><div><strong>Chennai Assembly</strong><span>Known commitment · {formatQty(evaluation.downstream.commitment)} units</span></div><StatusPill tone={downstreamProtected ? "green" : "coral"}>{downstreamProtected ? "Protected" : "At risk"}</StatusPill></div><div className="affected-row"><div className="location-orb slate">PUN</div><div><strong>Pune Buffer Hub</strong><span>Downstream data missing</span></div><StatusPill tone="amber">Unknown</StatusPill></div></div></Panel><Panel title="How to read this" eyebrow="EVIDENCE RULE"><p className="panel-copy">Solid connectors represent known demo relationships. A warning state means the planner needs another data refresh before treating the path as safe.</p><div className="evidence-quote"><AlertTriangle size={15} /><span>Risk unknown — insufficient data</span></div></Panel></div></div></>;
}

function Audit({ receipt, onExport }: { receipt: DecisionReceipt; onExport: () => void }) {
  return <><PageHeader eyebrow="EVIDENCE & AUDIT / 05" title="Keep the decision explainable." description="The receipt below mirrors the current rule-engine output. It is session-scoped evidence, not a claim of permanent audit storage." action={<button className="button button-primary" onClick={onExport}><Download size={15} />Download JSON</button>} /><div className="audit-meta"><div><span>SCENARIO ID</span><strong className="mono">{receipt.scenarioId}</strong></div><div><span>EVALUATED AT</span><strong>{new Date(receipt.evaluatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</strong></div><div><span>DATA SOURCE</span><strong><span className="source-indicator" />{receipt.source}</strong></div><div><span>RECORD STATUS</span><strong>In-memory session receipt</strong></div></div><div className="audit-layout"><Panel title="Decision receipt" eyebrow="ACTUAL ENGINE OUTPUT"><div className="receipt-recommendation"><div className="receipt-icon"><ClipboardCheck size={19} /></div><div><span>RECOMMENDATION</span><strong>{receipt.recommendation}</strong></div></div><ReceiptSection title="Inputs evaluated"><div className="receipt-grid">{Object.entries(receipt.inputs).map(([key, value]) => <div key={key}><span>{key.replace(/([A-Z])/g, " $1")}</span><strong>{value}</strong></div>)}</div></ReceiptSection><ReceiptSection title="Calculation"><div className="receipt-calc"><code>{receipt.calculation.formula}</code><div><span>Transferable stock</span><strong>{formatQty(receipt.calculation.transferableStock)} units</strong></div><div><span>Remaining after transfer</span><strong>{formatQty(receipt.calculation.remainingAfterTransfer)} units</strong></div><div><span>Destination coverage</span><strong>{receipt.calculation.coverage}%</strong></div></div></ReceiptSection><ReceiptSection title="Constraints evaluated"><div className="receipt-constraints">{receipt.constraints.map(item => <div key={item.label}><span className={`constraint-icon ${item.status}`}>{item.status === "pass" ? <Check size={13} /> : item.status === "warn" ? <AlertTriangle size={13} /> : <X size={13} />}</span><div><strong>{item.label}</strong><span>{item.detail}</span></div><b>{item.value}</b></div>)}</div></ReceiptSection></Panel><div className="audit-side"><Panel title="Data-quality limits" eyebrow="READ BEFORE USE"><div className="limit-list">{receipt.limitations.map(limit => <div key={limit}><Info size={14} /><span>{limit}</span></div>)}</div></Panel><Panel title="Provenance" eyebrow="SOURCE TRACE"><div className="provenance-list"><div><span className="source-indicator" /><div><strong>Synthetic demo data</strong><small>Inventory values, costs, relationships, and lead times</small></div><StatusPill tone="cyan">Declared</StatusPill></div><div><span className="source-indicator amber" /><div><strong>SAP read-only API</strong><small>Tenant access and authorized response not verified</small></div><StatusPill tone="amber">Pending</StatusPill></div></div></Panel></div></div></>;
}

function ReceiptSection({ title, children }: { title: string; children: React.ReactNode }) { return <div className="receipt-section"><h3>{title}</h3>{children}</div>; }

function DataPage() {
  const rules = [
    ["Transferable stock", "max(0, on-hand − reserved − committed − safety stock)", "Prevents protected or committed units from being moved."],
    ["Unknown is not zero", "Missing downstream values stay Unknown", "The engine avoids false confidence when evidence is incomplete."],
    ["Timing guardrail", "Lead time ≤ required arrival window", "A feasible quantity that arrives late is still rejected."],
    ["Downstream check", "Remaining balance ≥ known commitment", "Known dependent commitments stay protected after the move."],
  ];
  return <><PageHeader eyebrow="DATA & ASSUMPTIONS / 06" title="Know what the decision is built on." description="LineRescue keeps the demo basis, business rules, and missing evidence visible so a planner can challenge the recommendation." action={<StatusPill tone="cyan">Assumption ledger</StatusPill>} /><div className="data-grid"><Panel title="Demo data register" eyebrow="DECLARED INPUTS"><div className="data-register"><div><span className="register-index">01</span><div><strong>Inventory posture</strong><p>Hosur, Bengaluru, Pune, and Chennai quantities are realistic synthetic values for a college demonstration.</p></div><StatusPill tone="cyan">Synthetic</StatusPill></div><div><span className="register-index">02</span><div><strong>Costs & lead times</strong><p>Transport costs and arrival estimates are illustrative, not a quote or service commitment.</p></div><StatusPill tone="violet">Illustrative</StatusPill></div><div><span className="register-index">03</span><div><strong>Relationship graph</strong><p>Solid lines represent known demo relationships; missing downstream snapshots remain unknown.</p></div><StatusPill tone="amber">Partial</StatusPill></div></div></Panel><Panel title="Rulebook" eyebrow="DETERMINISTIC ENGINE"><div className="rule-table">{rules.map(([title, rule, detail]) => <div key={title} className="rule-row"><div><strong>{title}</strong><span>{detail}</span></div><code>{rule}</code></div>)}</div></Panel></div><div className="callout-row"><div className="callout-icon"><ShieldAlert size={17} /></div><div><strong>Known limitation</strong><span>Until SAP access is authorized and the response is mapped, the dashboard must remain in demo mode. It will not silently present synthetic values as live inventory.</span></div><Link href="/sap" className="button button-ghost">See SAP plan <ArrowRight size={14} /></Link></div></>;
}

function SapPage() {
  const [showSteps, setShowSteps] = useState(false);
  const [status, setStatus] = useState<{ mode: string; status: string; label: string; message: string; verifiedAt?: string; httpStatus?: number; api?: { resources: string[] } } | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; httpStatus: number; message: string; response?: unknown; error?: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => { fetch("/api/sap/status").then(response => response.json()).then(setStatus).catch(() => setStatus({ mode: "demo", status: "demo", label: "Demo Mode", message: "The SAP status endpoint could not be reached." })); }, []);
  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch("/api/sap/material-stock");
      const payload = await response.json();
      setTestResult({ ok: Boolean(payload.ok), httpStatus: response.status, message: payload.message ?? "SAP request completed.", response: payload.response, error: payload.error });
      const fresh = await fetch("/api/sap/status").then(result => result.json());
      setStatus(fresh);
    } catch {
      setTestResult({ ok: false, httpStatus: 0, message: "The protected SAP test endpoint could not be reached. No connection was verified." });
    } finally { setTesting(false); }
  };
  const currentTone = status?.status === "connected_verified" ? "green" : status?.status === "not_verified" ? "amber" : "cyan";
  return <><PageHeader eyebrow="SAP ARCHITECTURE / 07" title="Connect evidence, not assumptions." description="The intended path is read-only by design. Test Connection calls the protected backend adapter; the UI never simulates a successful SAP response." action={<StatusPill tone={currentTone}><CloudOff size={14} />{status?.label ?? "Checking SAP status"}</StatusPill>} /><div className="sap-status-strip"><div className={`sap-current-status ${currentTone}`}><span>CURRENT INTEGRATION STATE</span><strong>{status?.label ?? "Checking status…"}</strong><p>{status?.message ?? "Reading server-side configuration status."}</p>{status?.verifiedAt && <small>Verified at {new Date(status.verifiedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · HTTP {status.httpStatus}</small>}</div><div className="sap-state-legend"><div className={status?.status === "demo" ? "active" : ""}><span>01</span><strong>Demo Mode</strong><small>No tenant configured</small></div><div className={status?.status === "not_verified" ? "active" : ""}><span>02</span><strong>SAP Connection Not Verified</strong><small>Configured, request pending</small></div><div className={status?.status === "connected_verified" ? "active" : ""}><span>03</span><strong>Connected — Verified</strong><small>Only after real GET success</small></div></div></div><div className="architecture-flow"><ArchStep num="01" title="SAP S/4HANA Cloud" status="Planned" icon={ServerCog} detail="Tenant URL and practice access required" tone="amber" /><div className="flow-arrow"><ArrowRight size={17} /></div><ArchStep num="02" title="Material Stock — Read" status="Read-only" icon={LockKeyhole} detail="OData GET through server-side adapter" tone="violet" /><div className="flow-arrow"><ArrowRight size={17} /></div><ArchStep num="03" title="Secure backend adapter" status="Implemented" icon={ShieldCheck} detail="Timeouts, protected secrets, no mutation routes" tone="cyan" /><div className="flow-arrow"><ArrowRight size={17} /></div><ArchStep num="04" title="LineRescue dashboard" status="Demo-safe" icon={ScanSearch} detail="Only verified responses can change status" tone="green" /></div><div className="sap-grid"><Panel title="Integration-readiness checklist" eyebrow="WHAT MUST BE VERIFIED"><div className="sap-checklist"><div><span className="check-state done"><Check size={13} /></span><div><strong>Read-only intent</strong><span>No create, change, reserve, post, or delete operations are exposed.</span></div><StatusPill tone="green">Implemented</StatusPill></div><div><span className="check-state pending"><Minus size={13} /></span><div><strong>SAP tenant URL</strong><span>{status?.mode === "demo" ? "Missing server-side tenant configuration." : "Present server-side; verify the target tenant."}</span></div><StatusPill tone="amber">{status?.mode === "demo" ? "Missing" : "Pending"}</StatusPill></div><div><span className="check-state pending"><Minus size={13} /></span><div><strong>Authorization & communication arrangement</strong><span>Authorized client credentials and SAP communication setup are required.</span></div><StatusPill tone="amber">Pending</StatusPill></div><div><span className="check-state pending"><Minus size={13} /></span><div><strong>API configuration</strong><span>Material Stock — Read resource and API release must match the tenant.</span></div></div><div><span className="check-state pending"><Minus size={13} /></span><div><strong>Successful read request</strong><span>Run the protected test below; no success is assumed in demo mode.</span></div></div></div></Panel><Panel title="Test the protected connection" eyebrow="REAL REQUEST ONLY"><p className="panel-copy">This action requests a server-side OAuth token and performs a real read-only GET. Credentials and tokens never enter the browser response.</p><button className="button button-primary" onClick={testConnection} disabled={testing}>{testing ? <><RefreshCw size={15} className="spin" />Testing SAP…</> : <><RefreshCw size={15} />Test Connection</>}</button>{testResult && <div className={`sap-test-result ${testResult.ok ? "success" : "error"}`}><div><strong>{testResult.ok ? "Connected — Verified" : "SAP Connection Not Verified"}</strong><StatusPill tone={testResult.ok ? "green" : "amber"}>HTTP {testResult.httpStatus || "—"}</StatusPill></div><p>{testResult.message}</p>{testResult.error && <code>{testResult.error}</code>}{testResult.response !== undefined && <pre>{JSON.stringify(testResult.response, null, 2)}</pre>}</div>}</Panel></div><Panel title="Documented SAP resource" eyebrow="API_MATERIAL_STOCK"><p className="panel-copy">The intended integration is SAP S/4HANA Material Stock — Read. Example GET resources are shown only as documentation; the configured server-side path is the one actually tested.</p><div className="api-resource-list">{(status?.api?.resources ?? ["GET /sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MaterialStock", "GET /sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MatlStkInAcctMod"]).map(resource => <code key={resource}>{resource}</code>)}</div></Panel><div className="sap-followup"><button className="button button-ghost" onClick={() => setShowSteps(!showSteps)}>{showSteps ? "Hide prerequisites" : "Show prerequisites"}<ChevronDown size={15} className={showSteps ? "rotate" : ""} /></button>{showSteps && <div className="prerequisite-list"><div><span>01</span>Confirm the tenant URL and supported API release.</div><div><span>02</span>Create or verify a communication arrangement with read permission.</div><div><span>03</span>Store client credentials only in protected server configuration.</div><div><span>04</span>Run Test Connection and retain the real response status and provenance.</div></div>}</div></>;
}

function ArchStep({ num, title, status, detail, icon: Icon, tone }: { num: string; title: string; status: string; detail: string; icon: LucideIcon; tone: string }) { return <div className={`arch-step ${tone}`}><div className="arch-top"><span>{num}</span><Icon size={19} /></div><strong>{title}</strong><StatusPill tone={tone === "green" ? "green" : tone as "cyan" | "amber" | "violet"}>{status}</StatusPill><p>{detail}</p></div>; }

function BusinessPage() {
  return <><PageHeader eyebrow="BUSINESS VALUE / 08" title="Make recovery decisions safer and faster." description="LineRescue is decision support for planners who need to see the consequence of a transfer before they approve the next operational step." action={<StatusPill tone="violet">Expected outcomes</StatusPill>} /><div className="value-hero"><div><div className="value-hero-kicker">THE OPERATIONAL SHIFT</div><h2>From “where is stock?” to<br /><em>“what happens next?”</em></h2><p>Most dashboards stop at current inventory. LineRescue adds a transparent decision layer that makes shortage recovery options comparable, challengeable, and traceable.</p></div><div className="value-orbit"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><ShieldCheck size={28} /><span>Safer<br />decisions</span></div></div></div><div className="value-grid"><ValueCard number="01" title="Reduce unsafe transfers" detail="Guard reserved, committed, and safety stock before a source appears available." icon={ShieldAlert} /><ValueCard number="02" title="Improve planner visibility" detail="Put shortage, timing, downstream effects, and alternatives in one decision frame." icon={ScanSearch} /><ValueCard number="03" title="Increase traceability" detail="Attach a plain-language receipt to each evaluated scenario and its evidence limits." icon={ClipboardCheck} /><ValueCard number="04" title="Create a measurable baseline" detail="Treat savings and performance improvements as future evaluation targets, not invented facts." icon={BarChart3} /></div><div className="business-footer-note"><Zap size={15} /><span>Next evaluation target: measure avoided emergency procurement, planner review time, and decision reversals after a live pilot.</span></div></>;
}
function ValueCard({ number, title, detail, icon: Icon }: { number: string; title: string; detail: string; icon: LucideIcon }) { return <div className="value-card"><div className="value-card-top"><span>{number}</span><Icon size={18} /></div><h3>{title}</h3><p>{detail}</p><div className="value-line" /></div>; }

export default function LineRescueApp() {
  const [location, navigate] = useLocation();
  const [scenario, setScenario] = useState<Scenario>(cloneScenario);
  const evaluation = useMemo(() => evaluateScenario(scenario, true), [scenario]);
  const receipt = useMemo(() => createDecisionReceipt(scenario, true, new Date().toISOString()), [scenario]);
  const options = useMemo(() => buildRecoveryOptions(scenario), [scenario]);
  const exportReceipt = () => {
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${receipt.scenarioId.toLowerCase()}-decision-receipt.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const page = location === "/simulator" ? <Simulator scenario={scenario} setScenario={setScenario} evaluation={evaluation} receipt={receipt} onReset={() => setScenario(cloneScenario())} onExport={exportReceipt} /> : location === "/recovery" ? <Recovery options={options} scenario={scenario} onExport={exportReceipt} /> : location === "/impact" ? <Impact scenario={scenario} evaluation={evaluation} /> : location === "/audit" ? <Audit receipt={receipt} onExport={exportReceipt} /> : location === "/data" ? <DataPage /> : location === "/sap" ? <SapPage /> : location === "/business" ? <BusinessPage /> : <Cockpit receipt={receipt} evaluation={evaluation} onOpenReceipt={() => navigate("/audit")} />;
  return <LineRescueShell>{page}</LineRescueShell>;
}
