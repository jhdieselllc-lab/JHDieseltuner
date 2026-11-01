import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Calibration, LogSession, RoadUse, Vehicle } from "./types";
import { findVehicle } from "./vehicles";

const memory = new Map<string, string>();

const safeStorage = {
  getItem: (name: string) => (typeof window === "undefined" ? (memory.get(name) ?? null) : localStorage.getItem(name)),
  setItem: (name: string, value: string) => {
    if (typeof window === "undefined") memory.set(name, value);
    else localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined") memory.delete(name);
    else localStorage.removeItem(name);
  },
};

type CaliberState = {
  vehicleId: string;
  customs: Vehicle[];
  calibrations: Record<string, Calibration>;
  logs: Record<string, LogSession>;
  roadUse: RoadUse;
  setVehicle: (id: string) => void;
  addCustom: (vehicle: Vehicle) => void;
  removeCustom: (id: string) => void;
  setCalibration: (id: string, calibration: Calibration) => void;
  resetCalibration: (id: string) => void;
  setLog: (id: string, log: LogSession) => void;
  setRoadUse: (roadUse: RoadUse) => void;
};

export const useCaliber = create<CaliberState>()(
  persist(
    (set) => ({
      vehicleId: "ford-mustang-gt-2025",
      customs: [],
      calibrations: {},
      logs: {},
      roadUse: "street",
      setVehicle: (vehicleId) => set({ vehicleId }),
      addCustom: (vehicle) =>
        set((state) => ({
          customs: [vehicle, ...state.customs.filter((item) => item.id !== vehicle.id)],
          vehicleId: vehicle.id,
        })),
      removeCustom: (id) =>
        set((state) => ({
          customs: state.customs.filter((item) => item.id !== id),
          vehicleId: state.vehicleId === id ? "ford-mustang-gt-2025" : state.vehicleId,
        })),
      setCalibration: (id, calibration) =>
        set((state) => ({ calibrations: { ...state.calibrations, [id]: calibration } })),
      resetCalibration: (id) =>
        set((state) => {
          const calibrations = { ...state.calibrations };
          delete calibrations[id];
          return { calibrations };
        }),
      setLog: (id, log) => set((state) => ({ logs: { ...state.logs, [id]: log } })),
      setRoadUse: (roadUse) => set({ roadUse }),
    }),
    {
      name: "caliber-desk",
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (state) => ({
        vehicleId: state.vehicleId,
        customs: state.customs,
        calibrations: state.calibrations,
        logs: state.logs,
        roadUse: state.roadUse,
      }),
    },
  ),
);

export function resolveVehicle(vehicleId: string, customs: Vehicle[]): Vehicle {
  return (
    findVehicle(vehicleId, customs) ??
    findVehicle("ford-mustang-gt-2025", customs) ?? {
      id: "ford-mustang-gt-2025",
      year: 2025,
      make: "Ford",
      model: "Mustang",
      trim: "GT",
      engine: "5.0 Coyote V8",
      displacementL: 5,
      cylinders: 8,
      aspiration: "na",
      fuel: "87",
      trans: "10-speed auto",
      drivetrain: "RWD",
      powertrain: "ice",
      hp: 480,
      tq: 415,
      redline: 7500,
      peakBoostPsi: 0,
      category: "performance",
      notes: "",
    }
  );
}
