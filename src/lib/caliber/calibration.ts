import type {
  Calibration,
  ChannelId,
  Feel,
  RoadUse,
  TuneChange,
  TuneIntent,
  TuneProposal,
  Vehicle,
  ZoneCal,
  ZoneId,
} from "./types";
import { ZONES } from "./types";
import { vehicleLine } from "./vehicles";

const EMISSIONS =
  /\b(cat|cats|catalytic|catalyst|o2|oxygen sensor|egr|dpf|def|scr|egr cooler|evap|readiness)\b.{0,24}\b(delete|defeat|off|remove|disable|gut|straight pipe)\b|\b(delete|defeat|remove|disable|gut)\b.{0,24}\b(cat|cats|catalytic|catalyst|o2|egr|dpf|def|scr|emissions?)\b|\bdecat\b|\bstraight[\s-]?pipe\b|\bemissions?\s+(delete|off|defeat)\b|\bno\s+cats?\b/i;

const POPS = /\b(pop|pops|bang|bangs|crackle|crackles|burble|anti-lag|antilag|two-step|2-step)\b/i;

export const ZONE_META: Record<ZoneId, { label: string; hint: string }> = {
  idle: { label: "Idle", hint: "Stopped, closed throttle" },
  cruise: { label: "Cruise", hint: "Steady light load" },
  part: { label: "Part throttle", hint: "Everyday pull" },
  tipin: { label: "Tip-in", hint: "First touch of the pedal" },
  "wot-low": { label: "WOT low", hint: "Full throttle, low rpm" },
  "wot-mid": { label: "WOT mid", hint: "Full throttle, mid rpm" },
  "wot-high": { label: "WOT high", hint: "Full throttle, near redline" },
  cold: { label: "Cold start", hint: "Coolant not up to temperature" },
};

export function channelsFor(v: Vehicle): ChannelId[] {
  if (v.powertrain === "ev") return ["torque", "throttle", "regen"];
  const list: ChannelId[] = ["afr", "spark", "torque", "throttle"];
  if (v.aspiration !== "na" && v.aspiration !== "electric") list.splice(2, 0, "boost");
  if (v.powertrain === "hybrid") list.push("regen");
  return list;
}

export function channelLabel(channel: ChannelId, v: Vehicle): string {
  if (channel === "afr") return v.powertrain === "diesel" ? "Lambda" : "AFR";
  if (channel === "spark") return "Spark";
  if (channel === "boost") return "Boost";
  if (channel === "torque") return "Torque";
  if (channel === "throttle") return "Pedal";
  if (channel === "fuel") return "Fuel mass";
  return "Regen";
}

export function formatChannel(channel: ChannelId, v: Vehicle, value: number): string {
  if (channel === "afr") {
    if (v.powertrain === "ev") return "—";
    if (v.powertrain === "diesel") return value.toFixed(2);
    return value.toFixed(1);
  }
  if (channel === "spark") {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}°`;
  }
  if (channel === "boost") return `${value.toFixed(1)} psi`;
  return `${Math.round(value)}%`;
}

function zone(partial: Partial<ZoneCal>): ZoneCal {
  return {
    afr: 14.7,
    spark: 0,
    boost: 0,
    torque: 100,
    throttle: 100,
    fuel: 100,
    regen: 0,
    ...partial,
  };
}

function boostFor(zoneId: ZoneId, peak: number): number {
  if (peak <= 0) return 0;
  const scale: Record<ZoneId, number> = {
    idle: 0,
    cold: 0,
    cruise: 0.08,
    part: 0.35,
    tipin: 0.45,
    "wot-low": 0.7,
    "wot-mid": 0.92,
    "wot-high": 1,
  };
  return Math.round(peak * scale[zoneId] * 10) / 10;
}

export function stockCalibration(v: Vehicle): Calibration {
  const boosted = v.peakBoostPsi > 0 && v.aspiration !== "na" && v.powertrain !== "ev";
  const rich = v.aspiration === "na" || v.powertrain === "ev" ? 0 : v.aspiration === "supercharged" ? 0.4 : 0.8;

  if (v.powertrain === "ev") {
    const ev = (regen: number, torque = 100, throttle = 100): ZoneCal =>
      zone({ afr: 0, spark: 0, boost: 0, fuel: 100, regen, torque, throttle });
    return {
      idle: ev(25, 100, 100),
      cruise: ev(80, 100, 100),
      part: ev(45, 100, 100),
      tipin: ev(12, 100, 108),
      "wot-low": ev(0, 100, 100),
      "wot-mid": ev(0, 100, 100),
      "wot-high": ev(0, 100, 100),
      cold: ev(20, 92, 90),
    };
  }

  if (v.powertrain === "diesel") {
    const d = (lambda: number, id: ZoneId, torque = 100): ZoneCal =>
      zone({
        afr: lambda,
        spark: 0,
        boost: boostFor(id, v.peakBoostPsi),
        torque,
        throttle: 100,
        fuel: 100,
        regen: 0,
      });
    return {
      idle: d(2.1, "idle", 100),
      cruise: d(1.85, "cruise", 100),
      part: d(1.6, "part", 100),
      tipin: d(1.45, "tipin", 100),
      "wot-low": d(1.35, "wot-low", 100),
      "wot-mid": d(1.28, "wot-mid", 100),
      "wot-high": d(1.22, "wot-high", 100),
      cold: d(1.55, "cold", 88),
    };
  }

  const gas = (afr: number, id: ZoneId, regen = 0): ZoneCal =>
    zone({
      afr,
      spark: 0,
      boost: boosted ? boostFor(id, v.peakBoostPsi) : 0,
      torque: 100,
      throttle: 100,
      fuel: 100,
      regen,
    });

  const hybridRegen = v.powertrain === "hybrid";
  return {
    idle: gas(14.6, "idle", hybridRegen ? 15 : 0),
    cruise: gas(14.7, "cruise", hybridRegen ? 55 : 0),
    part: gas(14.1, "part", hybridRegen ? 25 : 0),
    tipin: gas(13.4, "tipin", hybridRegen ? 8 : 0),
    "wot-low": gas(13.2 - rich * 0.4, "wot-low", 0),
    "wot-mid": gas(13.0 - rich * 0.6, "wot-mid", 0),
    "wot-high": gas(12.8 - rich, "wot-high", 0),
    cold: gas(13.8, "cold", 0),
  };
}

function roundChannel(channel: ChannelId, value: number, v: Vehicle): number {
  if (channel === "afr") return v.powertrain === "diesel" ? Math.round(value * 100) / 100 : Math.round(value * 10) / 10;
  if (channel === "spark" || channel === "boost") return Math.round(value * 10) / 10;
  return Math.round(value);
}

type Band = { min: number; max: number };

function bandFor(
  channel: ChannelId,
  zoneId: ZoneId,
  stockValue: number,
  v: Vehicle,
  road: RoadUse,
): Band {
  const track = road === "track-only";
  const wot = zoneId === "wot-low" || zoneId === "wot-mid" || zoneId === "wot-high";
  let band: Band = { min: stockValue, max: stockValue };

  if (channel === "boost") {
    if (v.powertrain === "ev" || v.aspiration === "na" || v.aspiration === "electric" || v.peakBoostPsi <= 0) {
      band = { min: 0, max: 0 };
    } else if (zoneId === "idle" || zoneId === "cold") {
      band = { min: 0, max: stockValue };
    } else {
      const add = track ? Math.max(4, stockValue * 0.28) : Math.min(3.5, Math.max(1.2, v.peakBoostPsi * 0.16));
      const partCap = track ? stockValue + add : stockValue + (wot ? add : Math.min(2, add));
      band = { min: 0, max: Math.round(partCap * 10) / 10 };
    }
  } else if (channel === "spark") {
    if (v.powertrain === "ev") band = { min: 0, max: 0 };
    else if (zoneId === "cold") band = { min: -4, max: track ? 0.5 : 0 };
    else if (zoneId === "idle") band = { min: -3, max: track ? 1.5 : 1 };
    else band = { min: track ? -8 : -5, max: track ? 6 : wot ? 2.5 : 2 };
  } else if (channel === "afr") {
    if (v.powertrain === "ev") band = { min: 0, max: 0 };
    else if (v.powertrain === "diesel") {
      if (wot) band = { min: track ? 1.05 : 1.15, max: track ? 1.6 : 1.45 };
      else if (zoneId === "cruise" || zoneId === "idle") band = { min: 1.4, max: 2.3 };
      else band = { min: 1.25, max: 2 };
    } else if (wot) band = { min: track ? 10.8 : 11.1, max: track ? 14 : v.aspiration === "na" ? 13.8 : 13.2 };
    else if (zoneId === "cruise" || zoneId === "idle") band = { min: 13.6, max: track ? 15.6 : 15.2 };
    else if (zoneId === "cold") band = { min: 13, max: 14.8 };
    else band = { min: track ? 11.5 : 12.2, max: 14.8 };
  } else if (channel === "torque") {
    if (zoneId === "cold") band = { min: 80, max: track ? 100 : 96 };
    else band = { min: track ? 70 : 82, max: track ? 122 : 110 };
  } else if (channel === "throttle") {
    if (zoneId === "idle") band = { min: 100, max: 100 };
    else if (zoneId === "cold") band = { min: 85, max: 100 };
    else band = { min: track ? 75 : 82, max: track ? 135 : 122 };
  } else if (channel === "fuel") {
    band = { min: track ? 90 : 94, max: track ? 118 : 110 };
  } else if (zoneId.startsWith("wot")) {
    band = { min: 0, max: track ? 30 : 15 };
  } else {
    band = { min: 0, max: track ? 170 : 145 };
  }

  return {
    min: Math.min(band.min, stockValue),
    max: Math.max(band.max, stockValue),
  };
}

export function clampCalibration(
  cal: Calibration,
  stock: Calibration,
  v: Vehicle,
  road: RoadUse,
): { calibration: Calibration; limited: boolean } {
  let limited = false;
  const next = {} as Calibration;
  for (const zoneId of ZONES) {
    const row = { ...cal[zoneId] };
    for (const channel of Object.keys(row) as ChannelId[]) {
      const band = bandFor(channel, zoneId, stock[zoneId][channel], v, road);
      const rounded = roundChannel(channel, row[channel], v);
      const clamped = Math.min(band.max, Math.max(band.min, rounded));
      if (clamped !== rounded) limited = true;
      row[channel] = clamped;
    }
    next[zoneId] = row;
  }
  return { calibration: next, limited };
}

function expandChanges(changes: TuneChange[]): TuneChange[] {
  const out: TuneChange[] = [];
  for (const change of changes) {
    if (change.zone === "all") {
      for (const zoneId of ZONES) out.push({ ...change, zone: zoneId });
    } else out.push(change);
  }
  return out;
}

export function applyProposal(
  current: Calibration,
  proposal: TuneProposal,
  v: Vehicle,
  prompt: string,
): { calibration: Calibration; warnings: string[] } {
  const warnings = [...proposal.warnings];
  const text = prompt.toLowerCase();
  const allowIdle = /\bidle\b/.test(text);
  const allowCold = /\bcold\b/.test(text);
  let droppedProtected = false;
  const draft: Calibration = structuredClone(current);

  for (const change of expandChanges(proposal.changes)) {
    if (change.zone === "all") continue;
    if (!allowIdle && change.zone === "idle") {
      droppedProtected = true;
      continue;
    }
    if (!allowCold && change.zone === "cold") {
      droppedProtected = true;
      continue;
    }
    if (!channelsFor(v).includes(change.channel) && change.channel !== "fuel") continue;
    if (v.powertrain === "ev" && (change.channel === "afr" || change.channel === "spark" || change.channel === "boost")) {
      continue;
    }
    const base = draft[change.zone][change.channel];
    let value = base;
    if (change.mode === "set") value = change.value;
    else if (change.mode === "add") value = base + change.value;
    else if (change.mode === "scale") value = base * (change.value / 100);
    if (!Number.isFinite(value)) continue;
    draft[change.zone][change.channel] = value;
  }

  if (droppedProtected) warnings.push("Idle and cold start stayed stock.");
  const stock = stockCalibration(v);
  const clamped = clampCalibration(draft, stock, v, proposal.roadUse);
  if (clamped.limited) {
    warnings.push(
      proposal.roadUse === "track-only"
        ? "A few values were held at the track cap."
        : "A few values were held at the street cap.",
    );
  }
  return { calibration: clamped.calibration, warnings: unique(warnings) };
}

export function nudge(
  current: Calibration,
  stock: Calibration,
  v: Vehicle,
  road: RoadUse,
  zoneId: ZoneId,
  channel: ChannelId,
  direction: -1 | 1,
): { calibration: Calibration; limited: boolean } {
  const step: Record<ChannelId, number> = {
    afr: v.powertrain === "diesel" ? 0.02 : 0.1,
    spark: 0.5,
    boost: 0.5,
    torque: 2,
    throttle: 4,
    fuel: 1,
    regen: 5,
  };
  const draft = structuredClone(current);
  draft[zoneId][channel] = current[zoneId][channel] + step[channel] * direction;
  return clampCalibration(draft, stock, v, road);
}

function num(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function baseProposal(summary: string, intent: TuneIntent, roadUse: RoadUse): TuneProposal {
  return {
    summary,
    intent,
    roadUse,
    refused: false,
    refuseReason: "",
    warnings: [],
    changes: [],
  };
}

export function interpretLocally(prompt: string, v: Vehicle, roadDefault: RoadUse): TuneProposal {
  const text = prompt.toLowerCase().trim();
  const name = vehicleLine(v);

  if (EMISSIONS.test(text)) {
    return {
      summary: `${name} stays emissions-intact.`,
      intent: "daily",
      roadUse: "street",
      refused: true,
      refuseReason:
        "That asks to defeat emissions equipment. Caliber will not plan it. On public roads in the US those systems have to stay in place and working. Boost, spark, fuel, pedal, and torque can still move inside safe limits.",
      warnings: [],
      changes: [],
    };
  }

  const trackAsked = /\b(track|drag|strip|closed course|off[-\s]?highway|not for (the )?(street|road|public)|race only)\b/.test(
    text,
  );
  const streetAsked = /\b(street|daily|commute|public road|on the road)\b/.test(text);
  const roadUse: RoadUse = streetAsked ? "street" : trackAsked ? "track-only" : roadDefault;
  const warnings: string[] = [];
  if (POPS.test(text)) {
    warnings.push("Exhaust pops dump fuel into the catalyst. That was not added.");
  }
  if (roadUse === "track-only") {
    warnings.push("Marked track-only. Do not run this plan on public roads.");
  }

  const less = /\b(less|lower|reduc|drop|softer|milder|pull|retard)\b/.test(text);
  const wotOnly = /\b(wot|wide open|full throttle)\b/.test(text);
  const upTop = /\b(up top|high rpm|top end|near redline)\b/.test(text);
  const mid = /\b(midrange|mid range|mid rpm|in the middle)\b/.test(text);
  const cruiseOnly = /\b(cruise|highway|steady)\b/.test(text) && !wotOnly;
  const zonesForPower = (): ZoneId[] => {
    if (upTop) return ["wot-high"];
    if (mid) return ["wot-mid"];
    if (cruiseOnly && !/\bboost|timing|spark|power\b/.test(text)) return ["cruise"];
    if (wotOnly) return ["wot-low", "wot-mid", "wot-high"];
    return ["wot-low", "wot-mid", "wot-high"];
  };

  const changes: TuneChange[] = [];
  const intentBits: TuneIntent[] = [];

  const push = (zoneId: ZoneId | ZoneId[], channel: ChannelId, mode: TuneChange["mode"], value: number, reason: string) => {
    const zones = Array.isArray(zoneId) ? zoneId : [zoneId];
    for (const zone of zones) changes.push({ zone, channel, mode, value, reason });
  };

  if (v.powertrain === "ev") {
    if (/\b(regen|one[- ]pedal|lift off)\b/.test(text)) {
      intentBits.push("economy");
      const regen = less ? 75 : 125;
      push(["cruise", "part"], "regen", "scale", regen, less ? "Softer regen" : "Stronger regen");
    }
    if (/\b(soft|gentle|wet|rain|chill)\b/.test(text)) {
      intentBits.push("daily");
      push(["tipin", "wot-low", "wot-mid"], "torque", "set", 90, "Gentler torque request");
      push(["tipin"], "throttle", "set", 90, "Softer pedal");
    } else if (/\b(power|torque|quicker|faster|sharper|sport|response|pedal)\b/.test(text)) {
      intentBits.push(trackAsked ? "track" : "response");
      const torque = less ? 92 : trackAsked ? 112 : 106;
      push(less ? ["wot-low", "wot-mid", "wot-high"] : ["tipin"], "throttle", "set", less ? 92 : 116, "Pedal map");
      push(["wot-low", "wot-mid", "wot-high"], "torque", "set", torque, "Torque request");
    }
    if (/\b(economy|range|efficien)\b/.test(text)) {
      intentBits.push("economy");
      push(["cruise", "part"], "torque", "set", 94, "Lower cruise torque");
      push(["cruise"], "regen", "scale", 115, "More regen while cruising");
    }
    const summary = changes.length
      ? `${name} is electric, so this only moves torque, pedal, and regen. ${roadUse === "track-only" ? "Track caps are open." : "Street caps stay on."}`
      : `No table changes yet for ${name}. Try torque, pedal response, regen, or range.`;
    return {
      ...baseProposal(summary, intentBits[0] ?? "mixed", roadUse),
      warnings,
      changes,
    };
  }

  if (/\b(tow|towing|trailer|haul|payload|fifth wheel)\b/.test(text)) {
    intentBits.push("tow");
    push(["wot-low", "wot-mid", "wot-high", "part"], "torque", "set", 90, "Hold torque back for a load");
    push(["wot-low", "wot-mid", "wot-high"], "spark", "add", -1, "Less timing under load");
    push(["part", "tipin"], "throttle", "set", 92, "Calmer pedal while towing");
    if (v.peakBoostPsi > 0) push(["wot-mid", "wot-high"], "boost", "add", -1, "Slightly less boost in tow");
  }

  if (/\b(economy|mpg|efficien|fuel sav|hypermil)\b/.test(text)) {
    intentBits.push("economy");
    if (v.powertrain === "diesel") push(["cruise"], "afr", "set", 2.05, "Leaner light-load lambda");
    else push(["cruise"], "afr", "set", 15, "Slightly leaner cruise");
    push(["cruise"], "throttle", "set", 94, "Calmer cruise pedal");
    push(["cruise"], "fuel", "set", 98, "A touch less cruise fuel");
  }

  if (/\b(throttle|pedal|tip[-\s]?in|snapp|peppy|response|sharper)\b/.test(text)) {
    intentBits.push("response");
    push(["tipin", "part"], "throttle", "set", less ? 90 : 118, less ? "Softer pedal" : "Sharper tip-in");
    if (!less && !/\b(leave|don't touch|dont touch).{0,20}(timing|spark)\b/.test(text)) {
      push(["tipin"], "spark", "add", 0.5, "A little tip-in timing");
    }
  }

  const psi = num(text, /(\d+(?:\.\d+)?)\s*(?:psi|pounds?)\b/);
  const wantsBoost = psi !== null || /\bboost\b/.test(text);
  if (wantsBoost) {
    intentBits.push("performance");
    if (v.aspiration === "na" || v.peakBoostPsi <= 0) {
      warnings.push("This engine is not boosted. Boost stayed at zero. Pedal and spark can still change.");
    } else {
      const amount = psi ?? (less ? 1 : 1.5);
      const signed = less ? -Math.abs(amount) : Math.abs(amount);
      if (!less && (v.fuel === "87" || /\b87\b/.test(text))) {
        warnings.push("87 AKI is tight for added boost. The add stays small.");
      }
      push(zonesForPower(), "boost", "add", signed, "Boost target");
    }
  }

  const deg = num(text, /(-?\d+(?:\.\d+)?)\s*(?:degrees|degree|deg|°)/);
  const wantsSpark = deg !== null || /\b(timing|spark|advance)\b/.test(text);
  if (wantsSpark && !/\bthrottle\b/.test(text) || (wantsSpark && deg !== null)) {
    intentBits.push("performance");
    const amount = deg !== null ? Math.abs(deg) : less || /\b91\b/.test(text) ? 1 : roadUse === "track-only" ? 2 : 1;
    const signed = less || (deg !== null && deg < 0) ? -amount : amount;
    if (signed > 0 && (v.fuel === "87" || /\b87\b/.test(text)) && !/\b93\b/.test(text)) {
      warnings.push("Added timing on 87 was kept to a small step.");
    }
    push(zonesForPower(), "spark", "add", signed > 0 && v.fuel === "87" ? Math.min(signed, 1) : signed, "Spark offset");
  }

  if (/\bricher\b/.test(text)) {
    intentBits.push("performance");
    const targets = wotOnly || !cruiseOnly ? zonesForPower() : (["cruise"] as ZoneId[]);
    if (v.powertrain === "diesel") push(targets, "afr", "add", -0.05, "Richer lambda");
    else push(targets, "afr", "add", -0.3, "Richer mixture");
    push(targets, "fuel", "add", 3, "More fuel mass");
  }
  if (/\bleaner\b/.test(text)) {
    if (wotOnly) warnings.push("Wide-open was not leaned out. Cruise can be, carefully.");
    else {
      intentBits.push("economy");
      if (v.powertrain === "diesel") push(["cruise"], "afr", "add", 0.08, "Leaner cruise lambda");
      else push(["cruise"], "afr", "add", 0.2, "Leaner cruise");
    }
  }

  if (/\b(rain|wet|soft pedal|gentle)\b/.test(text) && !changes.some((c) => c.channel === "throttle")) {
    intentBits.push("daily");
    push(["tipin", "part"], "throttle", "set", 90, "Softer pedal");
    push(["wot-low", "wot-mid"], "torque", "set", 94, "Less torque in the wet");
  }

  if (/\b93\b/.test(text) && changes.some((c) => c.channel === "spark" || c.channel === "boost")) {
    warnings.push("Plan assumes 93 AKI. Drop back if the tank is 91 or 87.");
  }

  const intent: TuneIntent = intentBits.includes("tow")
    ? "tow"
    : intentBits.includes("economy") && !intentBits.includes("performance")
      ? "economy"
      : trackAsked
        ? "track"
        : intentBits.includes("response") && !intentBits.includes("performance")
          ? "response"
          : intentBits[0] ?? "mixed";

  const summary = changes.length
    ? `${name}. ${summarizeChanges(changes, v)} ${
        roadUse === "track-only" ? "Track caps apply." : "Street caps apply."
      } Idle and cold start stay put unless you name them.`
    : `No table changes yet for ${name}. Name boost, timing, pedal response, economy, or towing.`;

  return { ...baseProposal(summary, intent, roadUse), warnings: unique(warnings), changes };
}

function summarizeChanges(changes: TuneChange[], v: Vehicle): string {
  const bits = new Map<string, string>();
  for (const change of changes) {
    const key = `${change.channel}:${change.mode}:${change.value}`;
    const label = channelLabel(change.channel, v).toLowerCase();
    if (!bits.has(key)) {
      const how =
        change.mode === "add"
          ? `${change.value > 0 ? "+" : ""}${change.value} on ${label}`
          : change.mode === "scale"
            ? `${label} to ${change.value}%`
            : `${label} set to ${change.value}`;
      bits.set(key, how);
    }
  }
  return [...bits.values()].slice(0, 4).join(". ") + ".";
}

const ZONE_SET = new Set<string>(ZONES);
const CHANNEL_SET = new Set<string>(["afr", "spark", "boost", "torque", "throttle", "fuel", "regen", "all"]);

export function proposalFromModel(raw: unknown, fallback: TuneProposal): TuneProposal | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const refused = Boolean(o.refused);
  const summary = typeof o.summary === "string" ? o.summary.slice(0, 500) : fallback.summary;
  const refuseReason = typeof o.refuseReason === "string" ? o.refuseReason.slice(0, 500) : "";
  const warnings = Array.isArray(o.warnings)
    ? o.warnings.filter((w): w is string => typeof w === "string").slice(0, 6)
    : [];
  const roadUse: RoadUse = o.roadUse === "track-only" ? "track-only" : "street";
  const intents: TuneIntent[] = ["performance", "economy", "response", "tow", "track", "daily", "mixed"];
  const intent = intents.includes(o.intent as TuneIntent) ? (o.intent as TuneIntent) : fallback.intent;
  const changes: TuneChange[] = [];
  if (Array.isArray(o.changes)) {
    for (const item of o.changes.slice(0, 40)) {
      if (!item || typeof item !== "object") continue;
      const c = item as Record<string, unknown>;
      const zone = c.zone === "all" || ZONE_SET.has(String(c.zone)) ? (c.zone as TuneChange["zone"]) : null;
      const channel = CHANNEL_SET.has(String(c.channel)) ? (c.channel as ChannelId) : null;
      const mode = c.mode === "set" || c.mode === "add" || c.mode === "scale" ? c.mode : null;
      const value = typeof c.value === "number" ? c.value : Number(c.value);
      if (!zone || !channel || channel === ("all" as ChannelId) || !mode || !Number.isFinite(value)) continue;
      changes.push({
        zone,
        channel,
        mode,
        value,
        reason: typeof c.reason === "string" ? c.reason.slice(0, 140) : "",
      });
    }
  }
  if (!refused && changes.length === 0) return null;
  return { summary, intent, roadUse, refused, refuseReason, warnings, changes };
}

export function diffLines(stock: Calibration, cal: Calibration, v: Vehicle): string[] {
  const lines: string[] = [];
  const shown = new Set<ChannelId>([...channelsFor(v), "fuel"]);
  for (const zoneId of ZONES) {
    for (const channel of shown) {
      const from = stock[zoneId][channel];
      const to = cal[zoneId][channel];
      if (Math.abs(from - to) < 0.05) continue;
      lines.push(
        `${ZONE_META[zoneId].label} · ${channelLabel(channel, v)} · ${formatChannel(channel, v, from)} → ${formatChannel(channel, v, to)}`,
      );
    }
  }
  return lines;
}

export function zoneDirty(stock: ZoneCal, cal: ZoneCal, channels: ChannelId[]): boolean {
  return channels.some((channel) => Math.abs(stock[channel] - cal[channel]) >= 0.05) || Math.abs(stock.fuel - cal.fuel) >= 0.05;
}

export function feelOf(stock: Calibration, cal: Calibration, v: Vehicle): Feel {
  const response =
    cal.tipin.throttle -
    stock.tipin.throttle +
    (cal.tipin.spark - stock.tipin.spark) * 4 +
    (cal.part.throttle - stock.part.throttle) * 0.4;
  const peak =
    (v.peakBoostPsi > 0 ? cal["wot-mid"].boost - stock["wot-mid"].boost : 0) * 3 +
    (cal["wot-high"].spark - stock["wot-high"].spark) * 2 +
    (cal["wot-mid"].torque - stock["wot-mid"].torque) * 0.3;
  const economy =
    (v.powertrain === "diesel" || v.powertrain === "ev" ? 0 : cal.cruise.afr - stock.cruise.afr) * 8 +
    (stock.cruise.throttle - cal.cruise.throttle) * 0.15 +
    (v.powertrain === "ev" || v.powertrain === "hybrid" ? (cal.cruise.regen - stock.cruise.regen) * 0.05 : 0) -
    Math.max(0, cal.cruise.boost - stock.cruise.boost);

  const word = (n: number, up: Feel["peak"], down: Feel["peak"]): Feel["peak"] =>
    n > 1.2 ? up : n < -1.2 ? down : "stock";
  return {
    response: response > 2 ? "sharper" : response < -2 ? "softer" : "stock",
    peak: word(peak, "stronger", "softer"),
    economy: economy > 1 ? "lighter" : economy < -1 ? "thirstier" : "stock",
  };
}

export function sheetText(v: Vehicle, stock: Calibration, cal: Calibration, road: RoadUse): string {
  const lines = diffLines(stock, cal, v);
  return [
    "Caliber change sheet",
    vehicleLine(v),
    `${v.engine} · ${v.trans} · ${v.drivetrain} · fuel ${v.fuel}`,
    `Road use: ${road}`,
    "",
    lines.length ? lines.join("\n") : "No changes from stock.",
    "",
    "This is a plan, not an ECU file. It does not flash a vehicle.",
    "Emissions equipment was not altered.",
    "Figures are directional planning values, not a dyno sheet.",
  ].join("\n");
}

export function examplesFor(v: Vehicle): string[] {
  if (v.powertrain === "ev") {
    return [
      "Sharper pedal, keep it streetable",
      "More regen in traffic",
      "Gentler launch for wet roads",
      "Track use off public roads, a little more torque",
    ];
  }
  if (v.powertrain === "diesel") {
    return [
      "Towing, soften torque and protect the pull",
      "1 psi more boost in the midrange, street safe",
      "Highway economy on light load",
      "Pull a degree of timing under full throttle",
    ];
  }
  if (v.aspiration === "na") {
    return [
      "Sharper throttle, leave wide-open fueling alone",
      "Add 1 degree of timing up top on 93",
      "Highway economy, cruise only",
      "Softer pedal for rain",
    ];
  }
  return [
    "Add 1.5 psi up top on 93, street safe",
    "Sharper tip-in, leave wide-open alone",
    "Highway economy",
    "Pull 1 degree of timing on 91",
  ];
}

export function vehicleContext(v: Vehicle, road: RoadUse): string {
  return [
    `${vehicleLine(v)}`,
    `engine ${v.engine}`,
    `powertrain ${v.powertrain}`,
    `aspiration ${v.aspiration}`,
    `peak boost psi ${v.peakBoostPsi}`,
    `fuel ${v.fuel}`,
    `hp ${v.hp}`,
    `torque ${v.tq}`,
    `redline ${v.redline}`,
    `trans ${v.trans}`,
    `drive ${v.drivetrain}`,
    `category ${v.category}`,
    `default road use ${road}`,
    v.notes ? `notes ${v.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
