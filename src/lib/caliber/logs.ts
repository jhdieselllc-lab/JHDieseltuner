import type { Calibration, LogSample, LogSession, Vehicle, ZoneId } from "./types";

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function zoneAt(rpm: number, tps: number, redline: number): ZoneId {
  if (tps < 8 && rpm < redline * 0.25) return "idle";
  if (tps < 22) return "cruise";
  if (tps < 45) return "part";
  if (tps < 75) return "tipin";
  const x = rpm / redline;
  if (x < 0.45) return "wot-low";
  if (x < 0.75) return "wot-mid";
  return "wot-high";
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function makeSampleLog(v: Vehicle, cal: Calibration): LogSession {
  const rand = mulberry32(hash(`${v.id}:${v.hp}:${cal["wot-mid"].boost}:${cal["wot-high"].spark}:${cal.tipin.throttle}`));
  const samples: LogSample[] = [];
  const ev = v.powertrain === "ev";
  const diesel = v.powertrain === "diesel";
  let rpm = ev ? 0 : 850;
  let speed = ev ? 0 : 8;
  let boost = 0;
  let gear = 1;
  const points = 150;

  for (let i = 0; i < points; i++) {
    const t = Math.round(i * 0.1 * 10) / 10;
    let tps = 12;
    if (t < 2.2) tps = ev ? 8 : 14 + Math.sin(t * 2) * 3;
    else if (t < 3.2) tps = 14 + ((t - 2.2) / 1) * 86;
    else if (t < 10.6) tps = 100;
    else if (t < 11.4) tps = 100 - ((t - 10.6) / 0.8) * 80;
    else tps = ev ? 6 : 18;

    if (!ev) {
      if (t < 2.2) rpm = 900 + t * 280 + rand() * 30;
      else if (tps > 90) {
        const pull = (t - 3.2) / 7.4;
        const shifted = pull > 0.58;
        gear = shifted ? 3 : 2;
        const local = shifted ? (pull - 0.58) / 0.42 : pull / 0.58;
        const start = shifted ? v.redline * 0.62 : Math.max(1800, v.redline * 0.32);
        rpm = start + local * (v.redline * 0.94 - start);
        if (t > 10.6) rpm = Math.max(1400, rpm - (t - 10.6) * 900);
      } else {
        gear = speed > 45 ? 4 : 3;
        rpm = 1600 + speed * 18;
      }
      const accel = (tps / 100) * (0.9 + v.hp / 700) * (diesel ? 0.7 : 1);
      speed = clamp(speed + accel * 0.55 - speed * 0.012, 0, diesel ? 95 : 128);
    } else {
      gear = 1;
      const torquePct = tps > 80 ? cal["wot-mid"].torque / 100 : cal.cruise.torque / 100;
      const accel = (tps / 100) * torquePct * (0.8 + v.hp / 900);
      const regenDrag = tps < 10 ? (cal.cruise.regen / 100) * 0.35 : 0;
      speed = clamp(speed + accel * 0.7 - regenDrag - speed * 0.01, 0, 130);
      rpm = speed * 95 + 400;
    }

    const zone = zoneAt(rpm, tps, ev ? 14000 : v.redline);
    const targetBoost = ev ? 0 : cal[zone].boost;
    boost = boost * 0.78 + targetBoost * (tps > 40 ? 0.22 : 0.08);
    if (v.aspiration === "na" || ev) boost = 0;

    const load = clamp(tps * 0.72 + (boost / Math.max(8, v.peakBoostPsi || 8)) * 28, 0, 100);
    let afr = cal[zone].afr + (rand() - 0.5) * (diesel ? 0.03 : 0.08);
    if (ev) afr = 0;
    const sparkBase = diesel ? 6 : 10 + (rpm / 1000) * 2.2 - load * 0.05;
    const spark = ev ? 0 : sparkBase + cal[zone].spark + (rand() - 0.5) * 0.3;
    const hot = tps > 85 && rpm > (diesel ? 1800 : 3200);
    const aggressive = cal[zone].spark > 2.2 || (v.peakBoostPsi > 0 && boost > v.peakBoostPsi + 1.2);
    const knock = !ev && hot && aggressive && rand() < 0.18 ? 1 : 0;
    const iat = ev ? 24 : 26 + t * 0.7 + boost * 0.35 + rand();
    const ect = ev ? 32 + t * 0.15 : 86 + Math.min(8, t * 0.2);
    const wgdc = boost <= 0 ? 0 : clamp((boost / Math.max(1, targetBoost || v.peakBoostPsi || 1)) * 62, 0, 95);
    const regen = ev || v.powertrain === "hybrid" ? (tps < 12 ? cal.cruise.regen : tps < 30 ? cal.part.regen * 0.4 : 0) : 0;
    const powerKw = ev
      ? (tps / 100) * (cal[zone].torque / 100) * v.hp * 0.7459
      : (load / 100) * v.hp * 0.55 * 0.7459;

    samples.push({
      t,
      rpm: Math.round(rpm),
      load: Math.round(load),
      boost: Math.round(boost * 10) / 10,
      afr: ev ? 0 : Math.round(afr * (diesel ? 100 : 10)) / (diesel ? 100 : 10),
      spark: Math.round(spark * 10) / 10,
      knock,
      tps: Math.round(tps),
      iat: Math.round(iat),
      ect: Math.round(ect),
      speed: Math.round(speed),
      gear,
      wgdc: Math.round(wgdc),
      regen: Math.round(regen),
      powerKw: Math.round(powerKw),
    });
  }

  return {
    id: `sample-${v.id}`,
    name: "Sample pull from this plan",
    source: "sample",
    vehicleId: v.id,
    samples,
    note: "Simulated from the calibration on screen. It is not a recording from a car.",
  };
}

export type LogFinding = {
  title: string;
  detail: string;
  tone: "neutral" | "warn" | "danger";
  t: number | null;
};

export function analyzeLog(samples: LogSample[], v: Vehicle): LogFinding[] {
  if (samples.length === 0) return [];
  const findings: LogFinding[] = [];
  const maxRpm = Math.max(...samples.map((s) => s.rpm));
  const maxBoost = Math.max(...samples.map((s) => s.boost));
  const maxSpeed = Math.max(...samples.map((s) => s.speed));
  const maxIat = Math.max(...samples.map((s) => s.iat));
  const maxKw = Math.max(...samples.map((s) => s.powerKw));
  const wot = samples.filter((s) => s.tps >= 85);
  const mixture = wot.length ? Math.min(...wot.map((s) => s.afr)) : null;
  const knock = samples.filter((s) => s.knock > 0);

  if (v.powertrain === "ev") {
    findings.push({
      title: "Pull",
      detail: `Peak ${maxSpeed} mph and about ${maxKw} kW in this trace.`,
      tone: "neutral",
      t: samples.find((s) => s.powerKw === maxKw)?.t ?? null,
    });
  } else {
    findings.push({
      title: "Pull",
      detail: `Peak ${maxRpm.toLocaleString()} rpm${v.peakBoostPsi > 0 ? `, ${maxBoost.toFixed(1)} psi` : ""}, ${maxSpeed} mph.`,
      tone: "neutral",
      t: samples.find((s) => s.rpm === maxRpm)?.t ?? null,
    });
  }

  if (mixture !== null && v.powertrain !== "ev") {
    const lean =
      v.powertrain === "diesel"
        ? mixture > 1.5
        : v.aspiration === "na"
          ? mixture > 13.8
          : mixture > 13.1;
    const rich = v.powertrain === "diesel" ? mixture < 1.12 : mixture < 11;
    findings.push({
      title: v.powertrain === "diesel" ? "Lambda under load" : "Mixture under load",
      detail: lean
        ? `${mixture.toFixed(v.powertrain === "diesel" ? 2 : 1)} is lean for full throttle.`
        : rich
          ? `${mixture.toFixed(v.powertrain === "diesel" ? 2 : 1)} is richer than this desk likes to plan.`
          : `${mixture.toFixed(v.powertrain === "diesel" ? 2 : 1)} at full throttle, inside the planning window.`,
      tone: lean || rich ? "warn" : "neutral",
      t: wot.find((s) => s.afr === mixture)?.t ?? null,
    });
  }

  if (knock.length) {
    const first = knock[0];
    const last = knock[knock.length - 1];
    findings.push({
      title: "Knock",
      detail: `${knock.length} count${knock.length === 1 ? "" : "s"} between ${first.t.toFixed(1)}s and ${last.t.toFixed(1)}s, around ${first.rpm.toLocaleString()} rpm${v.peakBoostPsi > 0 ? ` and ${first.boost.toFixed(1)} psi` : ""}.`,
      tone: "danger",
      t: first.t,
    });
  } else if (v.powertrain !== "ev") {
    findings.push({
      title: "Knock",
      detail: "No knock counts in this trace.",
      tone: "neutral",
      t: null,
    });
  }

  if (!v.powertrain.includes("ev") && maxIat >= 55) {
    findings.push({
      title: "Intake temp",
      detail: `Intake air reached ${maxIat}°. Repeat pulls will give timing back.`,
      tone: "warn",
      t: samples.find((s) => s.iat === maxIat)?.t ?? null,
    });
  }

  return findings;
}

export function answerLog(question: string, samples: LogSample[], v: Vehicle): string {
  const findings = analyzeLog(samples, v);
  const q = question.toLowerCase();
  const lines = findings.map((f) => `${f.title}: ${f.detail}`);
  if (/\bknock/.test(q)) {
    const knock = findings.find((f) => f.title === "Knock");
    return knock?.detail ?? "No knock channel in this log.";
  }
  if (/\b(lean|afr|lambda|mixture|rich)/.test(q)) {
    return findings.find((f) => f.title.startsWith("Lambda") || f.title.startsWith("Mixture"))?.detail ?? lines.join(" ");
  }
  if (/\bboost/.test(q)) {
    const maxBoost = Math.max(...samples.map((s) => s.boost));
    const at = samples.find((s) => s.boost === maxBoost);
    return `Peak boost is ${maxBoost.toFixed(1)} psi${at ? ` at ${at.t.toFixed(1)}s` : ""}.`;
  }
  if (/\b(heat|iat|temp)/.test(q)) {
    return findings.find((f) => f.title === "Intake temp")?.detail ?? `Intake stayed at or under ${Math.max(...samples.map((s) => s.iat))}°.`;
  }
  return lines.join(" ");
}

const ALIAS: Record<string, keyof LogSample> = {
  t: "t",
  time: "t",
  timestamp: "t",
  sec: "t",
  seconds: "t",
  rpm: "rpm",
  load: "load",
  boost: "boost",
  boostpsi: "boost",
  map: "boost",
  afr: "afr",
  lambda: "afr",
  spark: "spark",
  timing: "spark",
  knock: "knock",
  knockcount: "knock",
  tps: "tps",
  throttle: "tps",
  pedal: "tps",
  iat: "iat",
  ect: "ect",
  coolant: "ect",
  speed: "speed",
  mph: "speed",
  gear: "gear",
  wgdc: "wgdc",
  wastegate: "wgdc",
  regen: "regen",
  power: "powerKw",
  powerkw: "powerKw",
  kw: "powerKw",
};

function blankSample(t: number): LogSample {
  return {
    t,
    rpm: 0,
    load: 0,
    boost: 0,
    afr: 0,
    spark: 0,
    knock: 0,
    tps: 0,
    iat: 0,
    ect: 0,
    speed: 0,
    gear: 0,
    wgdc: 0,
    regen: 0,
    powerKw: 0,
  };
}

export function parseCsv(text: string, vehicleId: string): { log: LogSession } | { error: string } {
  if (text.length > 1_000_000) return { error: "That file is over 1 MB. Export a shorter pull." };
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return { error: "Need a header row and at least one sample." };
  const header = lines[0].split(/,|\t|;/).map((cell) => cell.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
  const keys = header.map((cell) => ALIAS[cell] ?? null);
  if (!keys.includes("rpm") && !keys.includes("speed") && !keys.includes("tps")) {
    return { error: "Could not find rpm, speed, or throttle in the header." };
  }
  const samples: LogSample[] = [];
  for (const line of lines.slice(1, 4001)) {
    const cells = line.split(/,|\t|;/);
    const sample = blankSample(samples.length * 0.1);
    keys.forEach((key, index) => {
      if (!key) return;
      const value = Number(cells[index]);
      if (Number.isFinite(value)) sample[key] = value;
    });
    samples.push(sample);
  }
  if (!keys.includes("t")) {
    samples.forEach((sample, index) => {
      sample.t = Math.round(index * 0.1 * 10) / 10;
    });
  }
  if (samples.length === 0) return { error: "No numeric rows found." };
  return {
    log: {
      id: `csv-${vehicleId}-${hash(text).toString(16)}`,
      name: "Imported log",
      source: "csv",
      vehicleId,
      samples,
      note: `${samples.length} rows from your file.`,
    },
  };
}

export function logCsv(samples: LogSample[]): string {
  const headers = [
    "t",
    "rpm",
    "load",
    "boost",
    "afr",
    "spark",
    "knock",
    "tps",
    "iat",
    "ect",
    "speed",
    "gear",
    "wgdc",
    "regen",
    "powerKw",
  ] as const;
  const rows = samples.map((sample) => headers.map((key) => sample[key]).join(","));
  return [headers.join(","), ...rows].join("\n");
}

export function channelUnit(key: keyof LogSample, v: Vehicle): string {
  if (key === "t") return "s";
  if (key === "rpm") return v.powertrain === "ev" ? "motor" : "rpm";
  if (key === "boost") return "psi";
  if (key === "afr") return v.powertrain === "diesel" ? "λ" : "AFR";
  if (key === "spark") return "°";
  if (key === "speed") return "mph";
  if (key === "iat" || key === "ect") return "°";
  if (key === "powerKw") return "kW";
  if (key === "regen" || key === "tps" || key === "load" || key === "wgdc") return "%";
  return "";
}

