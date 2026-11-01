import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Calibration, LogSample, Vehicle } from "@/lib/caliber/types";
import { vehicleContext } from "@/lib/caliber/calibration";
import { analyzeLog, answerLog, channelUnit, logCsv, makeSampleLog, parseCsv } from "@/lib/caliber/logs";
import { assistCaliber } from "@/lib/caliber/assist.functions";
import { useCaliber } from "@/lib/caliber/store";
import { Button, cn, downloadText } from "./ui";

const STROKES = ["var(--color-accent)", "var(--color-fg)", "var(--color-muted)"];

type Key = keyof LogSample;

function optionsFor(vehicle: Vehicle): { key: Key; label: string }[] {
  if (vehicle.powertrain === "ev") {
    return [
      { key: "speed", label: "Speed" },
      { key: "powerKw", label: "Power" },
      { key: "regen", label: "Regen" },
      { key: "tps", label: "Pedal" },
      { key: "rpm", label: "Motor rpm" },
    ];
  }
  const list: { key: Key; label: string }[] = [
    { key: "rpm", label: "RPM" },
    { key: "tps", label: "Pedal" },
    { key: "afr", label: vehicle.powertrain === "diesel" ? "Lambda" : "AFR" },
    { key: "spark", label: "Spark" },
    { key: "speed", label: "Speed" },
    { key: "iat", label: "IAT" },
    { key: "knock", label: "Knock" },
  ];
  if (vehicle.peakBoostPsi > 0) list.splice(1, 0, { key: "boost", label: "Boost" }, { key: "wgdc", label: "Wastegate" });
  return list;
}

function defaultsFor(vehicle: Vehicle): Key[] {
  if (vehicle.powertrain === "ev") return ["speed", "powerKw", "regen"];
  if (vehicle.peakBoostPsi > 0) return ["rpm", "boost", "afr"];
  return ["rpm", "afr", "spark"];
}

const LEFT = new Set<Key>(["rpm", "speed", "powerKw"]);

export function LogView({
  vehicle,
  calibration,
  ready,
}: {
  vehicle: Vehicle;
  calibration: Calibration;
  ready: boolean;
}) {
  const log = useCaliber((s) => s.logs[vehicle.id]);
  const setLog = useCaliber((s) => s.setLog);
  const [keys, setKeys] = useState<Key[]>(defaultsFor(vehicle));
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [question, setQuestion] = useState("Where should I be careful?");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const options = optionsFor(vehicle);

  useEffect(() => {
    if (!ready) return;
    setKeys(defaultsFor(vehicle));
    setCursor(0);
    setPlaying(false);
    setAnswer("");
    if (!useCaliber.getState().logs[vehicle.id]) {
      setLog(vehicle.id, makeSampleLog(vehicle, calibration));
    }
    // Sample is rebuilt from the plan only when the vehicle changes, or via the button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle.id, ready]);

  useEffect(() => {
    if (!playing || !log) return;
    const id = window.setInterval(() => {
      setCursor((current) => {
        if (!log || current >= log.samples.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [playing, log]);

  const findings = useMemo(() => (log ? analyzeLog(log.samples, vehicle) : []), [log, vehicle]);
  const sample = log?.samples[Math.min(cursor, (log?.samples.length ?? 1) - 1)];

  function toggle(key: Key) {
    setKeys((current) => {
      if (current.includes(key)) return current.filter((item) => item !== key);
      const next = [...current, key];
      return next.length > 3 ? next.slice(1) : next;
    });
  }

  function ingest(text: string) {
    const parsed = parseCsv(text, vehicle.id);
    if ("error" in parsed) {
      setError(parsed.error);
      return;
    }
    setError("");
    setLog(vehicle.id, parsed.log);
    setCursor(0);
    setPlaying(false);
  }

  async function ask() {
    if (!log) return;
    const local = answerLog(question, log.samples, vehicle);
    setAnswer(local);
    setBusy(true);
    try {
      const compact = log.samples.filter((_, index) => index % 5 === 0).slice(0, 40);
      const result = await assistCaliber({
        data: {
          kind: "log",
          prompt: question,
          context: `${vehicleContext(vehicle, "street")}\nSource: ${log.note}\nFindings: ${local}\nSamples: ${JSON.stringify(compact)}`,
        },
      });
      if (result.ok) setAnswer(result.text);
    } catch {
      setAnswer(local);
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !log || !sample) {
    return (
      <section className="rounded-xl border border-line bg-surface p-4">
        <p className="text-sm text-muted">Building a sample pull…</p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-medium text-fg">{log.name}</h2>
            <p className="text-sm text-muted">{log.note}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => fileRef.current?.click()}>Import CSV</Button>
            <Button
              onClick={() => {
                setLog(vehicle.id, makeSampleLog(vehicle, calibration));
                setCursor(0);
                setPlaying(false);
              }}
            >
              Rebuild sample
            </Button>
            <Button variant="ghost" onClick={() => downloadText(`caliber-log-${vehicle.id}.csv`, logCsv(log.samples), "text/csv")}>
              Export
            </Button>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            void file.text().then(ingest);
            event.target.value = "";
          }}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {options.map((option) => {
            const on = keys.includes(option.key);
            const color = STROKES[Math.max(0, keys.indexOf(option.key))] ?? "var(--color-subtle)";
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(option.key)}
                className={cn(
                  "h-11 rounded-full border px-3 text-sm",
                  on ? "border-line bg-elevated text-fg" : "border-line text-muted",
                )}
              >
                <span className="mr-2 inline-block size-2 rounded-full" style={{ background: color }} aria-hidden />
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="mt-4 h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={log.samples} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="t" stroke="var(--color-subtle)" tick={{ fill: "var(--color-muted)", fontSize: 12 }} unit="s" />
              <YAxis yAxisId="left" stroke="var(--color-subtle)" tick={{ fill: "var(--color-muted)", fontSize: 12 }} width={48} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--color-subtle)" tick={{ fill: "var(--color-muted)", fontSize: 12 }} width={40} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-elevated)",
                  border: "1px solid var(--color-line)",
                  borderRadius: 8,
                  color: "var(--color-fg)",
                }}
                labelFormatter={(label) => `${label}s`}
              />
              <ReferenceLine x={sample.t} yAxisId="left" stroke="var(--color-muted)" strokeDasharray="3 3" />
              {keys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={options.find((option) => option.key === key)?.label ?? key}
                  yAxisId={LEFT.has(key) ? "left" : "right"}
                  stroke={STROKES[index] ?? STROKES[0]}
                  dot={false}
                  strokeWidth={1.75}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button
            className="w-11 px-0"
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => {
              if (cursor >= log.samples.length - 1) setCursor(0);
              setPlaying((value) => !value);
            }}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
          <input
            type="range"
            min={0}
            max={log.samples.length - 1}
            value={Math.min(cursor, log.samples.length - 1)}
            aria-label="Log position"
            onChange={(event) => {
              setPlaying(false);
              setCursor(Number(event.target.value));
            }}
          />
          <span className="w-14 font-mono text-sm text-muted tabular-nums">{sample.t.toFixed(1)}s</span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {keys.map((key) => (
            <div key={key}>
              <dt className="text-xs text-subtle">{options.find((option) => option.key === key)?.label}</dt>
              <dd className="font-mono text-sm text-fg tabular-nums">
                {typeof sample[key] === "number" ? Number(sample[key]).toLocaleString(undefined, { maximumFractionDigits: 1 }) : sample[key]}{" "}
                <span className="text-subtle">{channelUnit(key, vehicle)}</span>
              </dd>
            </div>
          ))}
          {!keys.includes("tps") ? (
            <div>
              <dt className="text-xs text-subtle">Pedal</dt>
              <dd className="font-mono text-sm text-fg tabular-nums">{sample.tps}%</dd>
            </div>
          ) : null}
        </dl>
      </section>
      <section className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-base font-medium text-fg">Reading</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {findings.map((finding) => (
            <li key={finding.title}>
              <button
                type="button"
                className="text-left"
                onClick={() => {
                  if (finding.t === null) return;
                  const index = log.samples.findIndex((item) => item.t >= finding.t!);
                  if (index >= 0) {
                    setPlaying(false);
                    setCursor(index);
                  }
                }}
              >
                <span className={cn("text-sm font-medium", finding.tone === "danger" ? "text-danger" : finding.tone === "warn" ? "text-warn" : "text-fg")}>
                  {finding.title}
                </span>
                <span className="mt-1 block text-sm text-muted">{finding.detail}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            className="h-11 w-full rounded-sm border border-line bg-bg px-3 text-sm text-fg outline-none"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            aria-label="Ask about this log"
          />
          <Button variant="primary" className="sm:min-w-36" disabled={busy || question.trim().length < 2} onClick={() => void ask()}>
            {busy ? "Reading…" : "Ask the log"}
          </Button>
        </div>
        {answer ? <p className="mt-3 text-sm text-fg">{answer}</p> : null}
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted">Paste a CSV instead</summary>
          <textarea
            className="mt-3 min-h-28 w-full rounded-md border border-line bg-bg px-3 py-3 font-mono text-xs text-fg"
            placeholder={"time,rpm,boost,afr,spark,knock,tps\n0.0,1800,2.1,14.6,12,0,18"}
            aria-label="Paste CSV log"
            onBlur={(event) => {
              if (event.target.value.trim()) ingest(event.target.value);
            }}
          />
        </details>
      </section>
    </div>
  );
}
