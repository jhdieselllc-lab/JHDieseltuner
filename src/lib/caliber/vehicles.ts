import type {
  Aspiration,
  Category,
  Drivetrain,
  Fuel,
  Powertrain,
  Vehicle,
} from "./types";

type Row = [
  id: string,
  year: number,
  make: string,
  model: string,
  trim: string,
  engine: string,
  disp: number | null,
  cyl: number | null,
  asp: Aspiration,
  fuel: Fuel,
  trans: string,
  drive: Drivetrain,
  pt: Powertrain,
  hp: number,
  tq: number,
  redline: number,
  boost: number,
  cat: Category,
  notes: string,
];

function row(r: Row): Vehicle {
  return {
    id: r[0],
    year: r[1],
    make: r[2],
    model: r[3],
    trim: r[4],
    engine: r[5],
    displacementL: r[6],
    cylinders: r[7],
    aspiration: r[8],
    fuel: r[9],
    trans: r[10],
    drivetrain: r[11],
    powertrain: r[12],
    hp: r[13],
    tq: r[14],
    redline: r[15],
    peakBoostPsi: r[16],
    category: r[17],
    notes: r[18],
  };
}

const ROWS: Row[] = [
  ["ford-mustang-gt-2025", 2025, "Ford", "Mustang", "GT", "5.0 Coyote V8", 5, 8, "na", "87", "10-speed auto", "RWD", "ice", 480, 415, 7500, 0, "performance", "87 minimum. Upper timing likes 93."],
  ["ford-mustang-dh-2025", 2025, "Ford", "Mustang", "Dark Horse", "5.0 Coyote V8", 5, 8, "na", "87", "6-speed manual", "RWD", "ice", 500, 418, 7500, 0, "performance", "Track-bred NA V8. 87 minimum."],
  ["ford-mustang-eb-2025", 2025, "Ford", "Mustang", "EcoBoost", "2.3 EcoBoost I4", 2.3, 4, "turbo", "87", "10-speed auto", "RWD", "ice", 315, 350, 6500, 18, "performance", "Single turbo. Heat soak shows up in repeat pulls."],
  ["chevy-corvette-2025", 2025, "Chevrolet", "Corvette", "Stingray", "6.2 LT2 V8", 6.2, 8, "na", "91", "8-speed DCT", "RWD", "ice", 495, 470, 6600, 0, "performance", "Mid-engine. 91 recommended."],
  ["chevy-corvette-z06-2025", 2025, "Chevrolet", "Corvette", "Z06", "5.5 LT6 V8", 5.5, 8, "na", "91", "8-speed DCT", "RWD", "ice", 670, 460, 8600, 0, "performance", "Flat-plane NA. High rpm is the power."],
  ["chevy-corvette-eray-2025", 2025, "Chevrolet", "Corvette", "E-Ray", "6.2 LT2 hybrid", 6.2, 8, "na", "91", "8-speed DCT", "AWD", "hybrid", 655, 595, 6600, 0, "performance", "Front motor plus LT2. Leave cold start alone."],
  ["chevy-corvette-zr1-2025", 2025, "Chevrolet", "Corvette", "ZR1", "5.5 LT7 twin-turbo V8", 5.5, 8, "twin-turbo", "93", "8-speed DCT", "RWD", "ice", 1064, 828, 8000, 20, "performance", "Factory peak boost is a planning estimate."],
  ["cadillac-ct5v-2025", 2025, "Cadillac", "CT5-V", "Blackwing", "6.2 supercharged V8", 6.2, 8, "supercharged", "93", "6-speed manual", "RWD", "ice", 668, 659, 6500, 10, "performance", "Supercharged. 93 required for the rated output."],
  ["cadillac-ct4v-2025", 2025, "Cadillac", "CT4-V", "Blackwing", "3.6 twin-turbo V6", 3.6, 6, "twin-turbo", "93", "6-speed manual", "RWD", "ice", 472, 445, 6500, 15, "performance", ""],
  ["dodge-challenger-scat-2023", 2023, "Dodge", "Challenger", "Scat Pack", "6.4 V8", 6.4, 8, "na", "91", "8-speed auto", "RWD", "ice", 485, 475, 6400, 0, "performance", "Last model year. Still common on US streets."],
  ["dodge-challenger-hellcat-2023", 2023, "Dodge", "Challenger", "SRT Hellcat", "6.2 supercharged V8", 6.2, 8, "supercharged", "91", "8-speed auto", "RWD", "ice", 717, 656, 6300, 11.6, "performance", "Last model year. Blower, not a turbo."],
  ["dodge-charger-six-2025", 2025, "Dodge", "Charger", "Sixpack", "3.0 Hurricane I6", 3, 6, "twin-turbo", "91", "8-speed auto", "AWD", "ice", 550, 531, 6500, 20, "performance", "High-output Hurricane. Boost figure is a planning estimate."],
  ["dodge-charger-daytona-2025", 2025, "Dodge", "Charger", "Daytona", "Dual motor", null, null, "electric", "electric", "Single-speed", "AWD", "ev", 670, 627, 14000, 0, "performance", "No spark or boost tables. Torque and regen only."],
  ["toyota-supra-2025", 2025, "Toyota", "GR Supra", "3.0", "3.0 turbo I6", 3, 6, "turbo", "91", "8-speed auto", "RWD", "ice", 382, 368, 6500, 16, "performance", "BMW B58 family. 91 recommended."],
  ["toyota-gr86-2025", 2025, "Toyota", "GR86", "Premium", "2.4 flat-4", 2.4, 4, "na", "91", "6-speed manual", "RWD", "ice", 228, 184, 7400, 0, "performance", ""],
  ["toyota-grcorolla-2025", 2025, "Toyota", "GR Corolla", "Circuit", "1.6 turbo I3", 1.6, 3, "turbo", "91", "6-speed manual", "AWD", "ice", 300, 295, 6500, 20, "performance", "Three-cylinder. Heat management matters on track."],
  ["subaru-wrx-2025", 2025, "Subaru", "WRX", "Premium", "2.4 turbo flat-4", 2.4, 4, "turbo", "91", "6-speed manual", "AWD", "ice", 271, 258, 6100, 14, "performance", ""],
  ["subaru-brz-2025", 2025, "Subaru", "BRZ", "Limited", "2.4 flat-4", 2.4, 4, "na", "91", "6-speed manual", "RWD", "ice", 228, 184, 7400, 0, "performance", ""],
  ["honda-ctr-2025", 2025, "Honda", "Civic", "Type R", "2.0 turbo I4", 2, 4, "turbo", "91", "6-speed manual", "FWD", "ice", 315, 310, 7000, 21, "performance", ""],
  ["honda-si-2025", 2025, "Honda", "Civic", "Si", "1.5 turbo I4", 1.5, 4, "turbo", "91", "6-speed manual", "FWD", "ice", 200, 192, 6600, 18, "car", ""],
  ["acura-integra-ts-2025", 2025, "Acura", "Integra", "Type S", "2.0 turbo I4", 2, 4, "turbo", "91", "6-speed manual", "FWD", "ice", 320, 310, 7000, 21, "performance", ""],
  ["vw-gti-2025", 2025, "Volkswagen", "Golf", "GTI", "2.0 turbo I4", 2, 4, "turbo", "91", "7-speed DCT", "FWD", "ice", 241, 273, 6500, 18, "car", ""],
  ["vw-golfr-2025", 2025, "Volkswagen", "Golf", "R", "2.0 turbo I4", 2, 4, "turbo", "91", "7-speed DCT", "AWD", "ice", 328, 310, 6800, 20, "performance", ""],
  ["nissan-z-2025", 2025, "Nissan", "Z", "Performance", "3.0 twin-turbo V6", 3, 6, "twin-turbo", "91", "6-speed manual", "RWD", "ice", 400, 350, 6800, 15, "performance", ""],
  ["nissan-z-nismo-2025", 2025, "Nissan", "Z", "Nismo", "3.0 twin-turbo V6", 3, 6, "twin-turbo", "91", "9-speed auto", "RWD", "ice", 420, 384, 6800, 16, "performance", ""],
  ["bmw-m340-2025", 2025, "BMW", "3 Series", "M340i", "3.0 turbo I6", 3, 6, "turbo", "91", "8-speed auto", "RWD", "ice", 386, 398, 6500, 16, "performance", "B58. xDrive cars use the same zone plan."],
  ["bmw-m2-2025", 2025, "BMW", "M2", "Base", "3.0 twin-turbo I6", 3, 6, "twin-turbo", "93", "8-speed auto", "RWD", "ice", 453, 406, 7200, 18, "performance", ""],
  ["bmw-m3-2025", 2025, "BMW", "M3", "Competition", "3.0 twin-turbo I6", 3, 6, "twin-turbo", "93", "8-speed auto", "RWD", "ice", 503, 479, 7200, 20, "performance", ""],
  ["audi-rs3-2025", 2025, "Audi", "RS3", "Base", "2.5 turbo I5", 2.5, 5, "turbo", "93", "7-speed DCT", "AWD", "ice", 401, 369, 7000, 20, "performance", ""],
  ["audi-s5-2025", 2025, "Audi", "S5", "Base", "3.0 turbo V6", 3, 6, "turbo", "91", "7-speed DCT", "AWD", "ice", 362, 369, 6500, 16, "car", ""],
  ["porsche-911-2025", 2025, "Porsche", "911", "Carrera", "3.0 twin-turbo flat-6", 3, 6, "twin-turbo", "93", "8-speed DCT", "RWD", "ice", 394, 331, 7500, 16, "performance", ""],
  ["porsche-718-2025", 2025, "Porsche", "718 Cayman", "GTS 4.0", "4.0 flat-6", 4, 6, "na", "91", "6-speed manual", "RWD", "ice", 394, 309, 7800, 0, "performance", ""],
  ["mazda-mx5-2025", 2025, "Mazda", "MX-5", "Club", "2.0 I4", 2, 4, "na", "91", "6-speed manual", "RWD", "ice", 181, 151, 7500, 0, "car", ""],
  ["hyundai-n-2025", 2025, "Hyundai", "Elantra", "N", "2.0 turbo I4", 2, 4, "turbo", "91", "8-speed DCT", "FWD", "ice", 276, 289, 6800, 18, "performance", ""],
  ["genesis-g70-2025", 2025, "Genesis", "G70", "3.3T", "3.3 twin-turbo V6", 3.3, 6, "twin-turbo", "91", "8-speed auto", "RWD", "ice", 365, 376, 6500, 16, "car", ""],
  ["lexus-is350-2025", 2025, "Lexus", "IS", "350", "3.5 V6", 3.5, 6, "na", "91", "8-speed auto", "RWD", "ice", 311, 280, 6600, 0, "car", ""],
  ["mercedes-c43-2025", 2025, "Mercedes-AMG", "C-Class", "C43", "2.0 turbo mild hybrid", 2, 4, "turbo", "91", "9-speed auto", "AWD", "hybrid", 402, 369, 6700, 20, "performance", "Mild hybrid. Exhaust turbine is electric-assisted."],
  ["bmw-x3-2025", 2025, "BMW", "X3", "M50", "3.0 turbo I6", 3, 6, "turbo", "91", "8-speed auto", "AWD", "ice", 393, 428, 6500, 17, "suv", ""],
  ["ford-f150-50-2025", 2025, "Ford", "F-150", "5.0", "5.0 Coyote V8", 5, 8, "na", "87", "10-speed auto", "4WD", "ice", 400, 410, 6500, 0, "truck", ""],
  ["ford-f150-35-2025", 2025, "Ford", "F-150", "3.5 EcoBoost", "3.5 twin-turbo V6", 3.5, 6, "twin-turbo", "87", "10-speed auto", "4WD", "ice", 400, 500, 6500, 16, "truck", ""],
  ["ford-f150-27-2025", 2025, "Ford", "F-150", "2.7 EcoBoost", "2.7 twin-turbo V6", 2.7, 6, "twin-turbo", "87", "10-speed auto", "4WD", "ice", 325, 400, 6500, 18, "truck", ""],
  ["ford-f150-pb-2025", 2025, "Ford", "F-150", "PowerBoost", "3.5 hybrid twin-turbo", 3.5, 6, "twin-turbo", "87", "10-speed auto", "4WD", "hybrid", 430, 570, 6500, 16, "truck", "Hybrid truck. Towing cares about torque limits."],
  ["ford-f150-raptor-2025", 2025, "Ford", "F-150", "Raptor", "3.5 HO EcoBoost", 3.5, 6, "twin-turbo", "91", "10-speed auto", "4WD", "ice", 450, 510, 6500, 18, "truck", ""],
  ["ford-f150-raptorr-2025", 2025, "Ford", "F-150", "Raptor R", "5.2 supercharged V8", 5.2, 8, "supercharged", "93", "10-speed auto", "4WD", "ice", 720, 640, 6500, 12, "truck", ""],
  ["ford-f250-67-2025", 2025, "Ford", "F-250", "Lariat", "6.7 Power Stroke", 6.7, 8, "turbo", "diesel", "10-speed auto", "4WD", "diesel", 500, 1200, 4000, 30, "truck", "Diesel. Mixture is shown as lambda, not gasoline AFR."],
  ["chevy-silverado-53-2025", 2025, "Chevrolet", "Silverado 1500", "5.3", "5.3 V8", 5.3, 8, "na", "87", "10-speed auto", "4WD", "ice", 355, 383, 6000, 0, "truck", ""],
  ["chevy-silverado-62-2025", 2025, "Chevrolet", "Silverado 1500", "6.2", "6.2 V8", 6.2, 8, "na", "91", "10-speed auto", "4WD", "ice", 420, 460, 6000, 0, "truck", ""],
  ["chevy-silverado-30d-2025", 2025, "Chevrolet", "Silverado 1500", "3.0 Duramax", "3.0 Duramax I6", 3, 6, "turbo", "diesel", "10-speed auto", "4WD", "diesel", 305, 495, 4500, 28, "truck", ""],
  ["gmc-sierra-53-2025", 2025, "GMC", "Sierra 1500", "5.3", "5.3 V8", 5.3, 8, "na", "87", "10-speed auto", "4WD", "ice", 355, 383, 6000, 0, "truck", ""],
  ["ram-1500-hurricane-2025", 2025, "Ram", "1500", "Hurricane", "3.0 Hurricane I6", 3, 6, "twin-turbo", "91", "8-speed auto", "4WD", "ice", 420, 469, 6200, 18, "truck", "Standard-output Hurricane."],
  ["ram-2500-cummins-2025", 2025, "Ram", "2500", "Cummins", "6.7 Cummins I6", 6.7, 6, "turbo", "diesel", "6-speed auto", "4WD", "diesel", 430, 1075, 3800, 32, "truck", "High-output Cummins. Towing is the point."],
  ["toyota-tundra-2025", 2025, "Toyota", "Tundra", "i-FORCE", "3.4 twin-turbo V6", 3.4, 6, "twin-turbo", "87", "10-speed auto", "4WD", "ice", 389, 479, 6200, 17, "truck", ""],
  ["toyota-tundra-max-2025", 2025, "Toyota", "Tundra", "i-FORCE MAX", "3.4 hybrid twin-turbo", 3.4, 6, "twin-turbo", "87", "10-speed auto", "4WD", "hybrid", 437, 583, 6200, 17, "truck", ""],
  ["toyota-tacoma-2025", 2025, "Toyota", "Tacoma", "i-FORCE", "2.4 turbo I4", 2.4, 4, "turbo", "87", "8-speed auto", "4WD", "ice", 278, 317, 6200, 16, "truck", ""],
  ["toyota-tacoma-max-2025", 2025, "Toyota", "Tacoma", "i-FORCE MAX", "2.4 hybrid turbo", 2.4, 4, "turbo", "87", "8-speed auto", "4WD", "hybrid", 326, 465, 6200, 16, "truck", ""],
  ["chevy-colorado-2025", 2025, "Chevrolet", "Colorado", "Trail Boss", "2.7 turbo I4", 2.7, 4, "turbo", "87", "8-speed auto", "4WD", "ice", 310, 430, 6000, 17, "truck", ""],
  ["gmc-canyon-2025", 2025, "GMC", "Canyon", "AT4", "2.7 turbo I4", 2.7, 4, "turbo", "87", "8-speed auto", "4WD", "ice", 310, 430, 6000, 17, "truck", ""],
  ["ford-ranger-2025", 2025, "Ford", "Ranger", "XLT", "2.7 EcoBoost V6", 2.7, 6, "twin-turbo", "87", "10-speed auto", "4WD", "ice", 315, 400, 6500, 18, "truck", ""],
  ["ford-ranger-raptor-2025", 2025, "Ford", "Ranger", "Raptor", "3.0 twin-turbo V6", 3, 6, "twin-turbo", "91", "10-speed auto", "4WD", "ice", 405, 430, 6500, 18, "truck", ""],
  ["ford-maverick-2025", 2025, "Ford", "Maverick", "Lariat", "2.0 EcoBoost", 2, 4, "turbo", "87", "8-speed auto", "AWD", "ice", 250, 277, 6500, 18, "truck", ""],
  ["jeep-gladiator-2025", 2025, "Jeep", "Gladiator", "Rubicon", "3.6 Pentastar V6", 3.6, 6, "na", "87", "8-speed auto", "4WD", "ice", 285, 260, 6500, 0, "truck", ""],
  ["nissan-frontier-2025", 2025, "Nissan", "Frontier", "PRO-4X", "3.8 V6", 3.8, 6, "na", "87", "9-speed auto", "4WD", "ice", 310, 281, 6400, 0, "truck", ""],
  ["ford-bronco-2025", 2025, "Ford", "Bronco", "Badlands", "2.7 EcoBoost V6", 2.7, 6, "twin-turbo", "87", "10-speed auto", "4WD", "ice", 330, 415, 6500, 18, "suv", ""],
  ["ford-bronco-raptor-2025", 2025, "Ford", "Bronco", "Raptor", "3.0 twin-turbo V6", 3, 6, "twin-turbo", "91", "10-speed auto", "4WD", "ice", 418, 440, 6500, 18, "suv", ""],
  ["jeep-wrangler-2025", 2025, "Jeep", "Wrangler", "Rubicon", "3.6 Pentastar V6", 3.6, 6, "na", "87", "8-speed auto", "4WD", "ice", 285, 260, 6500, 0, "suv", ""],
  ["jeep-wrangler-392-2024", 2024, "Jeep", "Wrangler", "Rubicon 392", "6.4 V8", 6.4, 8, "na", "91", "8-speed auto", "4WD", "ice", 470, 470, 6400, 0, "suv", ""],
  ["jeep-gc-2025", 2025, "Jeep", "Grand Cherokee", "Limited", "3.6 Pentastar V6", 3.6, 6, "na", "87", "8-speed auto", "AWD", "ice", 293, 260, 6500, 0, "suv", ""],
  ["chevy-tahoe-2025", 2025, "Chevrolet", "Tahoe", "LT", "5.3 V8", 5.3, 8, "na", "87", "10-speed auto", "4WD", "ice", 355, 383, 6000, 0, "suv", ""],
  ["ford-expedition-2025", 2025, "Ford", "Expedition", "Limited", "3.5 EcoBoost V6", 3.5, 6, "twin-turbo", "87", "10-speed auto", "4WD", "ice", 400, 500, 6200, 16, "suv", ""],
  ["toyota-sequoia-2025", 2025, "Toyota", "Sequoia", "i-FORCE MAX", "3.4 hybrid twin-turbo", 3.4, 6, "twin-turbo", "87", "10-speed auto", "4WD", "hybrid", 437, 583, 6200, 17, "suv", ""],
  ["toyota-4runner-2025", 2025, "Toyota", "4Runner", "TRD Off-Road", "2.4 turbo I4", 2.4, 4, "turbo", "87", "8-speed auto", "4WD", "ice", 278, 317, 6200, 16, "suv", ""],
  ["toyota-lc-2025", 2025, "Toyota", "Land Cruiser", "1958", "2.4 hybrid turbo", 2.4, 4, "turbo", "87", "8-speed auto", "4WD", "hybrid", 326, 465, 6200, 16, "suv", ""],
  ["lexus-gx-2025", 2025, "Lexus", "GX", "550", "3.4 twin-turbo V6", 3.4, 6, "twin-turbo", "91", "10-speed auto", "4WD", "ice", 349, 479, 6200, 16, "suv", ""],
  ["kia-telluride-2025", 2025, "Kia", "Telluride", "SX", "3.8 V6", 3.8, 6, "na", "87", "8-speed auto", "AWD", "ice", 291, 262, 6500, 0, "suv", ""],
  ["hyundai-palisade-2025", 2025, "Hyundai", "Palisade", "Limited", "3.8 V6", 3.8, 6, "na", "87", "8-speed auto", "AWD", "ice", 291, 262, 6500, 0, "suv", ""],
  ["honda-pilot-2025", 2025, "Honda", "Pilot", "TrailSport", "3.5 V6", 3.5, 6, "na", "87", "10-speed auto", "AWD", "ice", 285, 262, 6500, 0, "suv", ""],
  ["ford-explorer-st-2025", 2025, "Ford", "Explorer", "ST", "3.0 twin-turbo V6", 3, 6, "twin-turbo", "91", "10-speed auto", "AWD", "ice", 400, 415, 6500, 18, "suv", ""],
  ["subaru-crosstrek-2025", 2025, "Subaru", "Crosstrek", "Limited", "2.5 flat-4", 2.5, 4, "na", "87", "CVT", "AWD", "ice", 182, 178, 6200, 0, "suv", ""],
  ["toyota-camry-2025", 2025, "Toyota", "Camry", "XSE", "2.5 hybrid", 2.5, 4, "na", "87", "eCVT", "FWD", "hybrid", 225, 163, 5800, 0, "car", "Mostly an economy hybrid. Keep changes small."],
  ["honda-accord-2025", 2025, "Honda", "Accord", "Sport Hybrid", "2.0 hybrid", 2, 4, "na", "87", "eCVT", "FWD", "hybrid", 204, 247, 6200, 0, "car", ""],
  ["honda-crv-2025", 2025, "Honda", "CR-V", "Sport Hybrid", "2.0 hybrid", 2, 4, "na", "87", "eCVT", "AWD", "hybrid", 204, 247, 6200, 0, "suv", ""],
  ["toyota-rav4-2025", 2025, "Toyota", "RAV4", "Hybrid", "2.5 hybrid", 2.5, 4, "na", "87", "eCVT", "AWD", "hybrid", 219, 163, 5800, 0, "suv", ""],
  ["mazda-cx50-2025", 2025, "Mazda", "CX-50", "Turbo", "2.5 turbo I4", 2.5, 4, "turbo", "93", "6-speed auto", "AWD", "ice", 256, 320, 6300, 15, "suv", "Rated power wants 93. On 87 the factory derates it."],
  ["tesla-model3-2025", 2025, "Tesla", "Model 3", "Long Range", "Dual motor", null, null, "electric", "electric", "Single-speed", "AWD", "ev", 394, 0, 16000, 0, "car", "Horsepower is an estimate. Tune torque as a percent of stock."],
  ["tesla-modely-2025", 2025, "Tesla", "Model Y", "Long Range", "Dual motor", null, null, "electric", "electric", "Single-speed", "AWD", "ev", 380, 0, 16000, 0, "suv", "Horsepower is an estimate."],
  ["rivian-r1t-2025", 2025, "Rivian", "R1T", "Dual Motor", "Dual motor", null, null, "electric", "electric", "Single-speed", "AWD", "ev", 533, 0, 14000, 0, "truck", "Horsepower is an estimate for the sample log only."],
  ["ford-mache-2025", 2025, "Ford", "Mustang Mach-E", "GT", "Dual motor", null, null, "electric", "electric", "Single-speed", "AWD", "ev", 480, 0, 14000, 0, "suv", ""],
  ["chevy-silverado-ev-2025", 2025, "Chevrolet", "Silverado EV", "RST", "Dual motor", null, null, "electric", "electric", "Single-speed", "AWD", "ev", 754, 0, 12000, 0, "truck", ""],
  ["hyundai-ioniq5n-2025", 2025, "Hyundai", "Ioniq 5", "N", "Dual motor", null, null, "electric", "electric", "Single-speed", "AWD", "ev", 641, 0, 16000, 0, "performance", ""],
  ["kia-ev6gt-2025", 2025, "Kia", "EV6", "GT", "Dual motor", null, null, "electric", "electric", "Single-speed", "AWD", "ev", 576, 0, 16000, 0, "performance", ""],
  ["cadillac-lyriq-2025", 2025, "Cadillac", "Lyriq", "AWD", "Dual motor", null, null, "electric", "electric", "Single-speed", "AWD", "ev", 500, 0, 14000, 0, "suv", "Horsepower is an estimate."],
];

export const CATALOG: Vehicle[] = ROWS.map(row);

export const FEATURED = [
  "ford-mustang-gt-2025",
  "ford-f150-35-2025",
  "chevy-silverado-53-2025",
  "ram-2500-cummins-2025",
  "honda-ctr-2025",
  "toyota-supra-2025",
  "subaru-wrx-2025",
  "toyota-rav4-2025",
  "tesla-model3-2025",
  "chevy-corvette-2025",
];

export function vehicleName(v: Vehicle): string {
  return `${v.year} ${v.make} ${v.model}`;
}

export function vehicleLine(v: Vehicle): string {
  return `${vehicleName(v)} ${v.trim}`;
}

export function findVehicle(id: string, customs: Vehicle[]): Vehicle | undefined {
  return customs.find((v) => v.id === id) ?? CATALOG.find((v) => v.id === id);
}

export function searchVehicles(query: string): Vehicle[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    const featured = FEATURED.map((id) => CATALOG.find((v) => v.id === id)).filter(
      (v): v is Vehicle => Boolean(v),
    );
    return featured;
  }
  const tokens = q.split(/\s+/);
  return CATALOG.filter((v) => {
    const hay = [
      v.year,
      v.make,
      v.model,
      v.trim,
      v.engine,
      v.category,
      v.powertrain === "ev" ? "ev electric" : v.powertrain,
      v.aspiration === "na" ? "naturally aspirated na" : v.aspiration,
      v.fuel === "diesel" ? "diesel" : "",
      v.drivetrain,
    ]
      .join(" ")
      .toLowerCase();
    return tokens.every((token) => hay.includes(token));
  });
}

export function emptyCustom(seed: string): Vehicle {
  const year = new Date().getFullYear();
  return {
    id: `custom-${Date.now()}`,
    year,
    make: "",
    model: seed.trim() || "",
    trim: "Custom",
    engine: "",
    displacementL: null,
    cylinders: null,
    aspiration: "turbo",
    fuel: "91",
    trans: "Automatic",
    drivetrain: "AWD",
    powertrain: "ice",
    hp: 300,
    tq: 320,
    redline: 6500,
    peakBoostPsi: 14,
    category: "car",
    notes: "Described by you. Zones are estimated from the powertrain, not a factory file.",
    custom: true,
  };
}

export function aspirationBoostDefault(asp: Aspiration, pt: Powertrain): number {
  if (pt === "ev" || asp === "electric" || asp === "na") return 0;
  if (pt === "diesel") return 28;
  if (asp === "supercharged") return 10;
  if (asp === "twin-turbo") return 16;
  return 14;
}
