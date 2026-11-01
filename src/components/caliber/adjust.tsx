import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { Calibration, ChannelId, RoadUse, Vehicle, ZoneId } from "@/lib/caliber/types";
import { ZONES } from "@/lib/caliber/types";
import {
  ZONE_META,
  channelLabel,
  channelsFor,
  diffLines,
  feelOf,
  formatChannel,
  nudge,
  sheetText,
  zoneDirty,
} from "@/lib/caliber/calibration";
import { Button, downloadText } from "./ui";

export function Adjust({
  vehicle,
  stock,
  calibration,
  roadUse,
  onChange,
  onReset,
}: {
  vehicle: Vehicle;
  stock: Calibration;
  calibration: Calibration;
  roadUse: RoadUse;
  onChange: (next: Calibration) => void;
  onReset: () => void;
}) {
  const [onlyEdits, setOnlyEdits] = useState(false);
  const [note, setNote] = useState("");
  const channels = channelsFor(vehicle);
  const lines = diffLines(stock, calibration, vehicle);
  const feel = feelOf(stock, calibration, vehicle);
  const visibleZones = ZONES.filter((zoneId) => !onlyEdits || zoneDirty(stock[zoneId], calibration[zoneId], channels));

  function bump(zoneId: ZoneId, channel: ChannelId, direction: -1 | 1) {
    const result = nudge(calibration, stock, vehicle, roadUse, zoneId, channel, direction);
    const before = calibration[zoneId][channel];
    const after = result.calibration[zoneId][channel];
    if (after === before) {
      setNote(
        roadUse === "track-only"
          ? "That's the track cap for this zone."
          : "That's the street cap for this zone.",
      );
      return;
    }
    setNote("");
    onChange(result.calibration);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-medium text-fg">Compared with stock</h2>
            <p className="text-sm text-muted">
              Response {feel.response} · Peak {feel.peak} · Economy {feel.economy}. Directional only, not a dyno number.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() =>
                downloadText(
                  `caliber-${vehicle.id}.txt`,
                  sheetText(vehicle, stock, calibration, roadUse),
                )
              }
            >
              Change sheet
            </Button>
            <Button onClick={onReset} disabled={lines.length === 0}>
              Back to stock
            </Button>
          </div>
        </div>
        {lines.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Matches stock.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1">
            {lines.map((line) => (
              <li key={line} className="font-mono text-xs text-fg tabular-nums">
                {line}
              </li>
            ))}
          </ul>
        )}
        {note ? <p className="mt-3 text-sm text-warn">{note}</p> : null}
      </section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium text-fg">Zones</h2>
        {lines.length > 0 ? (
          <button
            type="button"
            className="h-11 px-2 text-sm text-muted hover:text-fg"
            onClick={() => setOnlyEdits((value) => !value)}
          >
            {onlyEdits ? "Show all zones" : "Show edits only"}
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {visibleZones.map((zoneId) => {
          const extraFuel = Math.abs(calibration[zoneId].fuel - stock[zoneId].fuel) >= 0.05;
          const shown = extraFuel ? [...channels, "fuel" as ChannelId] : channels;
          return (
            <article key={zoneId} className="rounded-xl border border-line bg-surface p-4">
              <h3 className="text-sm font-medium text-fg">{ZONE_META[zoneId].label}</h3>
              <p className="text-sm text-muted">{ZONE_META[zoneId].hint}</p>
              <ul className="mt-3 flex flex-col gap-3">
                {shown.map((channel) => (
                  <li key={channel} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-muted">{channelLabel(channel, vehicle)}</p>
                      <p className="font-mono text-sm text-fg tabular-nums">
                        {formatChannel(channel, vehicle, calibration[zoneId][channel])}
                      </p>
                      <p className="font-mono text-xs text-subtle tabular-nums">
                        stock {formatChannel(channel, vehicle, stock[zoneId][channel])}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="w-11 px-0"
                        aria-label={`Decrease ${channelLabel(channel, vehicle)} in ${ZONE_META[zoneId].label}`}
                        onClick={() => bump(zoneId, channel, -1)}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <Button
                        className="w-11 px-0"
                        aria-label={`Increase ${channelLabel(channel, vehicle)} in ${ZONE_META[zoneId].label}`}
                        onClick={() => bump(zoneId, channel, 1)}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
