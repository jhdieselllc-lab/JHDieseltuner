import { useRef, useState } from "react";
import type { Calibration, RoadUse, TuneProposal, Vehicle } from "@/lib/caliber/types";
import {
  applyProposal,
  examplesFor,
  interpretLocally,
  proposalFromModel,
  vehicleContext,
} from "@/lib/caliber/calibration";
import { assistCaliber } from "@/lib/caliber/assist.functions";
import { Button, cn } from "./ui";

function parseModel(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export function PromptDesk({
  vehicle,
  calibration,
  roadUse,
  onApply,
}: {
  vehicle: Vehicle;
  calibration: Calibration;
  roadUse: RoadUse;
  onApply: (next: Calibration, note: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [proposal, setProposal] = useState<TuneProposal | null>(null);
  const [source, setSource] = useState<"On-device" | "Assistant" | "">("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState(false);
  const ticket = useRef(0);

  async function read(text: string) {
    const clean = text.trim();
    if (clean.length < 2) return;
    setPrompt(clean);
    const local = interpretLocally(clean, vehicle, roadUse);
    const id = ++ticket.current;
    setProposal(local);
    setSource("On-device");
    setApplied(false);
    setStatus("");
    if (local.refused) return;
    setBusy(true);
    try {
      const result = await assistCaliber({
        data: { kind: "tune", prompt: clean, context: vehicleContext(vehicle, roadUse) },
      });
      if (ticket.current !== id) return;
      if (!result.ok) {
        setStatus("Using the on-device reading.");
        return;
      }
      const model = proposalFromModel(parseModel(result.text), local);
      if (!model) {
        setStatus("Using the on-device reading.");
        return;
      }
      setProposal(model);
      setSource("Assistant");
      setStatus("");
    } catch {
      if (ticket.current === id) setStatus("Using the on-device reading.");
    } finally {
      if (ticket.current === id) setBusy(false);
    }
  }

  function apply() {
    if (!proposal || proposal.refused || proposal.changes.length === 0) return;
    const result = applyProposal(calibration, proposal, vehicle, prompt);
    onApply(result.calibration, result.warnings.join(" "));
    setApplied(true);
    setStatus(result.warnings[0] ?? "Applied to the plan.");
  }

  const examples = examplesFor(vehicle);

  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-fg">Prompt</h2>
          <p className="text-sm text-muted">Say what you want the car to do. Idle and cold start stay stock unless you name them.</p>
        </div>
      </div>
      <textarea
        className="mt-3 min-h-24 w-full resize-y rounded-md border border-line bg-bg px-3 py-3 text-sm text-fg outline-none placeholder:text-subtle"
        value={prompt}
        maxLength={800}
        placeholder="Add 1.5 psi up top on 93, and keep it street safe."
        aria-label="Tuning prompt"
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void read(prompt);
          }
        }}
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button variant="primary" className="sm:min-w-40" disabled={busy || prompt.trim().length < 2} onClick={() => void read(prompt)}>
          {busy ? "Reading…" : "Read prompt"}
        </Button>
        <div className="flex flex-wrap gap-2">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              className="min-h-11 rounded-full border border-line px-3 py-2 text-left text-sm text-muted hover:text-fg"
              onClick={() => void read(example)}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
      {proposal ? (
        <div className="mt-4 rounded-md border border-line bg-bg p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-fg">{proposal.refused ? "Not planned" : "Reading"}</p>
            {source ? <span className="text-xs text-subtle">{source}</span> : null}
            <span className="text-xs text-subtle">{proposal.roadUse === "track-only" ? "Track-only" : "Street"}</span>
          </div>
          <p className="mt-2 text-sm text-fg">{proposal.refused ? proposal.refuseReason : proposal.summary}</p>
          {proposal.warnings.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-1">
              {proposal.warnings.map((warning) => (
                <li key={warning} className="text-sm text-warn">
                  {warning}
                </li>
              ))}
            </ul>
          ) : null}
          {proposal.changes.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-1">
              {proposal.changes.slice(0, 8).map((change, index) => (
                <li key={`${change.zone}-${change.channel}-${index}`} className="font-mono text-xs text-muted tabular-nums">
                  {change.zone} · {change.channel} · {change.mode} {change.value}
                  {change.reason ? ` · ${change.reason}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {!proposal.refused && proposal.changes.length > 0 ? (
              <Button variant="primary" onClick={apply} disabled={applied}>
                {applied ? "Applied" : "Apply to plan"}
              </Button>
            ) : null}
            <Button
              variant="ghost"
              onClick={() => {
                setProposal(null);
                setStatus("");
              }}
            >
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}
      {status ? <p className={cn("mt-3 text-sm", status.startsWith("That's") ? "text-warn" : "text-muted")}>{status}</p> : null}
    </section>
  );
}
