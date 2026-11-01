import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { Calibration, ChannelId, RoadUse, Vehicle, ZoneId } from "@/lib/caliber/types";
import { channelLabel, channelsFor, formatChannel, nudge } from "@/lib/caliber/calibration";
import { ZONE_META } from "@/lib/caliber/calibration";
import { Button, cn } from "./ui";

const LOADS = [20, 40, 60, 80, 100];

function zoneFor(rpm: number, load: number, redline: number): ZoneId {
  if (load <= 25 && rpm <= Math.min(1400, redline * 0.25)) return "idle";
  if (load <= 40) return "cruise";
  if (load <= 65) return "part";
  if (load <= 80) return "tipin";
  if (rpm < redline * 0.5) return "wot-low";
  if (rpm < redline * 0.75) return "wot-mid";
  return "wot-high";
}

export function MapGrid({
  vehicle,
  stock,
  calibration,
  roadUse,
  onChange,
}: {
  vehicle: Vehicle;
  stock: Calibration;
  calibration: Calibration;
  roadUse: RoadUse;
  onChange: (next: Calibration) => void;
}) {
  const channels = [...channelsFor(vehicle), "fuel" as ChannelId].filter(
    (channel, index, list) => list.indexOf(channel) === index && (channel !== "fuel" || vehicle.powertrain !== "ev"),
  );
  const [channel, setChannel] = useState<ChannelId>(channels[0] ?? "torque");
  const [note, setNote] = useState("");
  const redline = vehicle.powertrain === "ev" ? 14000 : vehicle.redline;
  const step = vehicle.powertrain === "ev" ? 2000 : 1000;
  const rpms: number[] = [];
  for (let rpm = vehicle.powertrain === "ev" ? 2000 : 1000; rpm <= redline + 50; rpm += step) {
    rpms.push(rpm);
    if (rpms.length > 8) break;
  }

  function bump(zoneId: ZoneId, direction: -1 | 1) {
    const result = nudge(calibration, stock, vehicle, roadUse, zoneId, channel, direction);
    if (result.calibration[zoneId][channel] === calibration[zoneId][channel]) {
      setNote(roadUse === "track-only" ? "That's the track cap for this zone." : "That's the street cap for this zone.");
      return;
    }
    setNote("");
    onChange(result.calibration);
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-medium text-fg">Map</h2>
          <p className="text-sm text-muted">
            Cells that share a zone move together. Cold start is not on this hot map.
            {vehicle.powertrain === "diesel" ? " Mixture is lambda." : ""}
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Channel
          <select
            className="h-11 rounded-sm border border-line bg-bg px-3 text-sm text-fg"
            value={channel}
            onChange={(event) => setChannel(event.target.value as ChannelId)}
          >
            {channels.map((item) => (
              <option key={item} value={item}>
                {channelLabel(item, vehicle)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {note ? <p className="mt-3 text-sm text-warn">{note}</p> : null}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-2xl border-separate border-spacing-1 text-left">
          <thead>
            <tr>
              <th className="px-2 py-1 text-xs font-medium text-subtle">{vehicle.powertrain === "ev" ? "Motor" : "RPM"}</th>
              {LOADS.map((load) => (
                <th key={load} className="px-2 py-1 text-xs font-medium text-subtle">
                  {load}% load
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rpms.map((rpm) => (
              <tr key={rpm}>
                <th className="px-2 py-1 font-mono text-xs font-medium text-muted tabular-nums">{rpm}</th>
                {LOADS.map((load) => {
                  const zoneId = zoneFor(rpm, load, redline);
                  const value = calibration[zoneId][channel];
                  const base = stock[zoneId][channel];
                  const delta = value - base;
                  const scale = channel === "afr" ? 1 : channel === "spark" || channel === "boost" ? 3 : 12;
                  const mix = Math.min(1, Math.abs(delta) / scale);
                  return (
                    <td key={load} className="align-top">
                      <div
                        className={cn("rounded-sm border border-line p-2", delta === 0 && "bg-elevated")}
                        style={
                          delta === 0
                            ? undefined
                            : {
                                background: `color-mix(in oklab, var(--color-accent) ${Math.round(mix * 50)}%, var(--color-elevated))`,
                              }
                        }
                      >
                        <p className="font-mono text-xs text-fg tabular-nums">{formatChannel(channel, vehicle, value)}</p>
                        <p className="text-xs text-subtle">{ZONE_META[zoneId].label}</p>
                        <div className="mt-2 flex gap-1">
                          <Button
                            className="h-11 w-11 px-0"
                            aria-label={`Decrease ${ZONE_META[zoneId].label}`}
                            onClick={() => bump(zoneId, -1)}
                          >
                            <Minus className="size-4" />
                          </Button>
                          <Button
                            className="h-11 w-11 px-0"
                            aria-label={`Increase ${ZONE_META[zoneId].label}`}
                            onClick={() => bump(zoneId, 1)}
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
