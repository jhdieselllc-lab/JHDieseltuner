export type Powertrain = "ice" | "hybrid" | "diesel" | "ev";

export type Aspiration = "na" | "turbo" | "twin-turbo" | "supercharged" | "electric";

export type Fuel = "87" | "91" | "93" | "diesel" | "electric";

export type Drivetrain = "FWD" | "RWD" | "AWD" | "4WD";

export type Category = "car" | "truck" | "suv" | "performance";

export type Vehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  engine: string;
  displacementL: number | null;
  cylinders: number | null;
  aspiration: Aspiration;
  fuel: Fuel;
  trans: string;
  drivetrain: Drivetrain;
  powertrain: Powertrain;
  hp: number;
  tq: number;
  redline: number;
  peakBoostPsi: number;
  category: Category;
  notes: string;
  custom?: boolean;
};

export const ZONES = [
  "idle",
  "cruise",
  "part",
  "tipin",
  "wot-low",
  "wot-mid",
  "wot-high",
  "cold",
] as const;

export type ZoneId = (typeof ZONES)[number];

export const CHANNELS = [
  "afr",
  "spark",
  "boost",
  "torque",
  "throttle",
  "fuel",
  "regen",
] as const;

export type ChannelId = (typeof CHANNELS)[number];

export type ZoneCal = Record<ChannelId, number>;

export type Calibration = Record<ZoneId, ZoneCal>;

export type RoadUse = "street" | "track-only";

export type ChangeMode = "set" | "add" | "scale";

export type TuneChange = {
  zone: ZoneId | "all";
  channel: ChannelId;
  mode: ChangeMode;
  value: number;
  reason: string;
};

export type TuneIntent =
  | "performance"
  | "economy"
  | "response"
  | "tow"
  | "track"
  | "daily"
  | "mixed";

export type TuneProposal = {
  summary: string;
  intent: TuneIntent;
  roadUse: RoadUse;
  refused: boolean;
  refuseReason: string;
  warnings: string[];
  changes: TuneChange[];
};

export type LogSample = {
  t: number;
  rpm: number;
  load: number;
  boost: number;
  afr: number;
  spark: number;
  knock: number;
  tps: number;
  iat: number;
  ect: number;
  speed: number;
  gear: number;
  wgdc: number;
  regen: number;
  powerKw: number;
};

export type LogSession = {
  id: string;
  name: string;
  source: "sample" | "csv";
  vehicleId: string;
  samples: LogSample[];
  note: string;
};

export type FeelWord = "softer" | "stock" | "sharper";

export type Feel = {
  response: FeelWord;
  peak: "softer" | "stock" | "stronger";
  economy: "thirstier" | "stock" | "lighter";
};
