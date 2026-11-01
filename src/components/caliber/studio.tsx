import { useEffect, useMemo, useState } from "react";
import type { Calibration } from "@/lib/caliber/types";
import { stockCalibration } from "@/lib/caliber/calibration";
import { resolveVehicle, useCaliber } from "@/lib/caliber/store";
import { vehicleLine } from "@/lib/caliber/vehicles";
import { Adjust } from "./adjust";
import { Garage } from "./garage";
import { LogView } from "./log-view";
import { MapGrid } from "./map-grid";
import { PromptDesk } from "./prompt-desk";
import { Button, cn } from "./ui";

type Tab = "zones" | "map" | "log";

export function Studio() {
  const vehicleId = useCaliber((s) => s.vehicleId);
  const customs = useCaliber((s) => s.customs);
  const calibrations = useCaliber((s) => s.calibrations);
  const roadUse = useCaliber((s) => s.roadUse);
  const setRoadUse = useCaliber((s) => s.setRoadUse);
  const setCalibration = useCaliber((s) => s.setCalibration);
  const resetCalibration = useCaliber((s) => s.resetCalibration);
  const [tab, setTab] = useState<Tab>("zones");
  const [garageOpen, setGarageOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [undo, setUndo] = useState<Calibration | null>(null);
  const [banner, setBanner] = useState("");

  useEffect(() => {
    const unsub = useCaliber.persist.onFinishHydration(() => setReady(true));
    if (useCaliber.persist.hasHydrated()) setReady(true);
    else void useCaliber.persist.rehydrate();
    return unsub;
  }, []);

  const vehicle = useMemo(() => resolveVehicle(vehicleId, customs), [vehicleId, customs]);
  const stock = useMemo(() => stockCalibration(vehicle), [vehicle]);
  const calibration = calibrations[vehicle.id] ?? stock;

  useEffect(() => {
    setUndo(null);
    setBanner("");
  }, [vehicle.id]);

  function commit(next: Calibration, note = "") {
    setUndo(calibration);
    setCalibration(vehicle.id, next);
    setBanner(note);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "zones", label: "Zones" },
    { id: "map", label: "Map" },
    { id: "log", label: "Log" },
  ];

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-line bg-bg">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold tracking-tight text-fg">Caliber</p>
            <p className="truncate text-sm text-muted">{vehicleLine(vehicle)}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-line p-1" role="group" aria-label="Road use">
              {(["street", "track-only"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={roadUse === mode}
                  className={cn(
                    "h-11 rounded-sm px-3 text-sm",
                    roadUse === mode ? "bg-elevated text-fg" : "text-muted",
                  )}
                  onClick={() => setRoadUse(mode)}
                >
                  {mode === "street" ? "Street" : "Track"}
                </button>
              ))}
            </div>
            <Button className="lg:hidden" onClick={() => setGarageOpen(true)}>
              Vehicles
            </Button>
          </div>
        </div>
      </header>
      <div className="grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-line lg:block lg:min-h-[calc(100vh-4.5rem)]">
          <Garage vehicle={vehicle} />
        </aside>
        <main className="min-w-0 px-4 py-4 lg:px-6 lg:py-6">
          <p className="max-w-3xl text-sm text-muted">
            Prompt a change, then scrub a log. Same desk for a Mustang, an F-150, a Civic, or a vehicle you describe.
            Caliber plans the calibration. It does not connect to a car or write an ECU.
          </p>
          {roadUse === "track-only" ? (
            <p className="mt-2 text-sm text-warn">Track caps are open. Do not use that plan on public roads.</p>
          ) : null}
          <div className="mt-4">
            <PromptDesk
              vehicle={vehicle}
              calibration={calibration}
              roadUse={roadUse}
              onApply={(next, note) => {
                commit(next, note);
                setTab("zones");
              }}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex rounded-md border border-line p-1" role="tablist" aria-label="Desk">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  className={cn("h-11 rounded-sm px-4 text-sm", tab === item.id ? "bg-elevated text-fg" : "text-muted")}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              disabled={!undo}
              onClick={() => {
                if (!undo) return;
                setCalibration(vehicle.id, undo);
                setUndo(null);
                setBanner("Undid the last edit.");
              }}
            >
              Undo
            </Button>
          </div>
          {banner ? <p className="mt-3 text-sm text-muted">{banner}</p> : null}
          <div className="mt-4" role="tabpanel">
            {tab === "zones" ? (
              <Adjust
                vehicle={vehicle}
                stock={stock}
                calibration={calibration}
                roadUse={roadUse}
                onChange={(next) => commit(next)}
                onReset={() => {
                  setUndo(calibration);
                  resetCalibration(vehicle.id);
                  setBanner("Back to the stock plan.");
                }}
              />
            ) : null}
            {tab === "map" ? (
              <MapGrid
                vehicle={vehicle}
                stock={stock}
                calibration={calibration}
                roadUse={roadUse}
                onChange={(next) => commit(next)}
              />
            ) : null}
            {tab === "log" ? <LogView vehicle={vehicle} calibration={calibration} ready={ready} /> : null}
          </div>
          <footer className="mt-8 border-t border-line pt-4 pb-8">
            <p className="max-w-3xl text-xs text-subtle">
              Planning tool only. On US public roads, emissions equipment has to stay installed and working — requests to
              remove it are declined. Boost targets come from public powertrain data, not a read of your ECU. Sample logs
              are simulated from the plan on screen. Import a CSV if you have a real trace.
            </p>
            {vehicle.notes ? <p className="mt-2 max-w-3xl text-xs text-subtle">{vehicle.notes}</p> : null}
          </footer>
        </main>
      </div>
      {garageOpen ? (
        <div className="fixed inset-0 z-30 bg-bg lg:hidden">
          <Garage vehicle={vehicle} onClose={() => setGarageOpen(false)} onPick={() => setGarageOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
