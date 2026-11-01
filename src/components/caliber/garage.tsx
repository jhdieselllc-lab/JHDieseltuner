import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Aspiration, Category, Fuel, Powertrain, Vehicle } from "@/lib/caliber/types";
import {
  CATALOG,
  aspirationBoostDefault,
  emptyCustom,
  searchVehicles,
  vehicleLine,
} from "@/lib/caliber/vehicles";
import { useCaliber } from "@/lib/caliber/store";
import { Button, Field, cn, controlClass } from "./ui";

export function Garage({
  vehicle,
  onPick,
  onClose,
}: {
  vehicle: Vehicle;
  onPick?: () => void;
  onClose?: () => void;
}) {
  const customs = useCaliber((s) => s.customs);
  const addCustom = useCaliber((s) => s.addCustom);
  const removeCustom = useCaliber((s) => s.removeCustom);
  const setVehicle = useCaliber((s) => s.setVehicle);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Vehicle | null>(null);
  const [error, setError] = useState("");
  const results = useMemo(() => searchVehicles(query), [query]);

  function pick(id: string) {
    setVehicle(id);
    onPick?.();
  }

  function saveCustom() {
    if (!draft) return;
    if (!draft.make.trim() || !draft.model.trim()) {
      setError("Make and model are required.");
      return;
    }
    const boost =
      draft.powertrain === "ev" || draft.aspiration === "na"
        ? 0
        : draft.peakBoostPsi;
    addCustom({
      ...draft,
      make: draft.make.trim(),
      model: draft.model.trim(),
      engine: draft.engine.trim() || draft.powertrain,
      peakBoostPsi: boost,
      aspiration: draft.powertrain === "ev" ? "electric" : draft.aspiration,
      fuel: draft.powertrain === "ev" ? "electric" : draft.powertrain === "diesel" ? "diesel" : draft.fuel,
      redline: draft.powertrain === "ev" ? 14000 : draft.powertrain === "diesel" ? 4000 : draft.redline,
      custom: true,
    });
    setDraft(null);
    setError("");
    onPick?.();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <div>
          <p className="text-sm font-medium text-fg">Garage</p>
          <p className="text-sm text-muted">{CATALOG.length} late-model US vehicles</p>
        </div>
        {onClose ? (
          <Button variant="ghost" className="px-3" onClick={onClose} aria-label="Close garage">
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-3 left-3 size-4 text-subtle" />
          <input
            className={cn(controlClass, "pl-9")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search make, model, diesel, EV"
            aria-label="Search vehicles"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {customs.length > 0 && !query ? (
          <ul className="mb-3 flex flex-col gap-1">
            {customs.map((item) => (
              <li key={item.id}>
                <VehicleButton item={item} active={item.id === vehicle.id} onPick={() => pick(item.id)} />
              </li>
            ))}
          </ul>
        ) : null}
        {results.length === 0 ? (
          <p className="px-2 text-sm text-muted">
            Nothing in the catalog matches. Describe it and Caliber will build a desk from the powertrain.
          </p>
        ) : (
          <>
            <p className="px-2 pb-2 text-xs font-medium tracking-wide text-subtle uppercase">
              {query ? "Matches" : "Start here"}
            </p>
            <ul className="flex flex-col gap-1">
              {results.map((item) => (
                <li key={item.id}>
                  <VehicleButton item={item} active={item.id === vehicle.id} onPick={() => pick(item.id)} />
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-4 px-1 pb-4">
          {draft ? (
            <form
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveCustom();
              }}
            >
              <p className="text-sm font-medium text-fg">Describe a vehicle</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Year">
                  <input
                    className={controlClass}
                    inputMode="numeric"
                    value={draft.year}
                    onChange={(event) => setDraft({ ...draft, year: Number(event.target.value) || draft.year })}
                  />
                </Field>
                <Field label="Fuel">
                  <select
                    className={controlClass}
                    value={draft.fuel}
                    onChange={(event) => setDraft({ ...draft, fuel: event.target.value as Fuel })}
                  >
                    <option value="87">87</option>
                    <option value="91">91</option>
                    <option value="93">93</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                  </select>
                </Field>
              </div>
              <Field label="Make">
                <input
                  className={controlClass}
                  value={draft.make}
                  onChange={(event) => setDraft({ ...draft, make: event.target.value })}
                />
              </Field>
              <Field label="Model">
                <input
                  className={controlClass}
                  value={draft.model}
                  onChange={(event) => setDraft({ ...draft, model: event.target.value })}
                />
              </Field>
              <Field label="Engine">
                <input
                  className={controlClass}
                  value={draft.engine}
                  placeholder="3.5 twin-turbo V6"
                  onChange={(event) => setDraft({ ...draft, engine: event.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Powertrain">
                  <select
                    className={controlClass}
                    value={draft.powertrain}
                    onChange={(event) => {
                      const powertrain = event.target.value as Powertrain;
                      const aspiration: Aspiration =
                        powertrain === "ev" ? "electric" : powertrain === "diesel" ? "turbo" : draft.aspiration;
                      setDraft({
                        ...draft,
                        powertrain,
                        aspiration,
                        peakBoostPsi: aspirationBoostDefault(aspiration, powertrain),
                        fuel: powertrain === "ev" ? "electric" : powertrain === "diesel" ? "diesel" : draft.fuel,
                      });
                    }}
                  >
                    <option value="ice">Gas</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="diesel">Diesel</option>
                    <option value="ev">Electric</option>
                  </select>
                </Field>
                <Field label="Induction">
                  <select
                    className={controlClass}
                    value={draft.aspiration}
                    onChange={(event) => {
                      const aspiration = event.target.value as Aspiration;
                      setDraft({
                        ...draft,
                        aspiration,
                        peakBoostPsi: aspirationBoostDefault(aspiration, draft.powertrain),
                      });
                    }}
                  >
                    <option value="na">Naturally aspirated</option>
                    <option value="turbo">Turbo</option>
                    <option value="twin-turbo">Twin-turbo</option>
                    <option value="supercharged">Supercharged</option>
                    <option value="electric">Electric</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Horsepower">
                  <input
                    className={controlClass}
                    inputMode="numeric"
                    value={draft.hp}
                    onChange={(event) => setDraft({ ...draft, hp: Number(event.target.value) || 0 })}
                  />
                </Field>
                <Field label="Body">
                  <select
                    className={controlClass}
                    value={draft.category}
                    onChange={(event) => setDraft({ ...draft, category: event.target.value as Category })}
                  >
                    <option value="car">Car</option>
                    <option value="performance">Performance</option>
                    <option value="truck">Truck</option>
                    <option value="suv">SUV</option>
                  </select>
                </Field>
              </div>
              {draft.powertrain !== "ev" && draft.aspiration !== "na" ? (
                <Field label="Peak boost, psi">
                  <input
                    className={controlClass}
                    inputMode="decimal"
                    value={draft.peakBoostPsi}
                    onChange={(event) => setDraft({ ...draft, peakBoostPsi: Number(event.target.value) || 0 })}
                  />
                </Field>
              ) : null}
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <div className="flex gap-2">
                <Button variant="primary" type="submit" className="flex-1">
                  Use this vehicle
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setDraft(null);
                    setError("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              className="w-full"
              onClick={() => {
                setDraft(emptyCustom(query));
                setError("");
              }}
            >
              Describe a vehicle that is not listed
            </Button>
          )}
          {vehicle.custom ? (
            <button
              type="button"
              className="mt-3 text-sm text-muted underline-offset-2 hover:text-fg hover:underline"
              onClick={() => removeCustom(vehicle.id)}
            >
              Remove this custom vehicle
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function VehicleButton({
  item,
  active,
  onPick,
}: {
  item: Vehicle;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "w-full rounded-md px-3 py-2 text-left",
        active ? "bg-elevated text-fg" : "text-muted hover:bg-surface hover:text-fg",
      )}
    >
      <span className="block text-sm font-medium text-fg">{vehicleLine(item)}</span>
      <span className="block text-xs text-muted">
        {item.engine}
        {item.custom ? " · described" : ""}
      </span>
    </button>
  );
}
