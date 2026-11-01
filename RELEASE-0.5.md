# JH Diesel 0.5

## Implemented

- Airflow calculator with displacement, RPM, VE, boost, atmospheric pressure, charge/inlet temperatures, pressure losses and explicit compressor-map correction references. Distinguishes manifold CFM, standard CFM (15°C / 1 atm) and corrected mass flow.
- Compressor wheel trim and separate full/splitter/turbine blade records. Blade count is descriptive, never an assumed airflow multiplier. Exact manufacturer compressor maps are still required to assess surge, choke, efficiency and shaft speed.
- Gasoline/ethanol port-injector sizing using user-supplied BSFC, fuel density, duty and differential fuel pressure. Diesel mode reports total fuel mass per cylinder firing cycle; no rail-pressure, nozzle, injection timing or duration model is implied.
- Scope CSV imports for CAN-H and CAN-L, differential and common-mode plots, sample-window selection, voltage extrema, sample-interval and aliasing observations. CAN frame CSV imports with per-ID counts and maximum gaps, user-supplied module labels/expected periods and exportable observation records. Synthetic CI files are test fixtures, never presented as vehicle data.
- 2017-onward Chevrolet/GMC, Ford/Lincoln and Ram/Dodge/Jeep network research profiles, with explicit network/pin/probe records. These do not identify connected modules or provide vehicle-specific decoder databases.
- OEM portal shortcuts restricted to an allowlist in the Electron main process; user-entered, persistent module/calibration inventory. No factory-server integration, calibration downloads, license bypass, or OEM flashing.
- Saved 2003 and 2004 Eclipse 2.4L project presets. PCM Hammer remains restricted to confirmed P01/P59 legacy GM gasoline projects. Eclipse native diagnostics, definitions and flash protocol remain unimplemented.
- DEF/SCR, DPF, EGR, catalyst and OBD monitor worksheets with fitted equipment, requested configuration and measured diagnostic notes. Disable requests are explicitly unsupported planning records, not executable calibrations. Retaining, restoring or diagnosing a system also requires a real OEM/service workflow outside the worksheet.

## Validation

The Windows workflow checks TypeScript, reference engineering calculations, invalid capture inputs, OEM navigation rejection, existing log/worker tests, installer build, installation, packaged application runtime, bundled Python discovery, the new forms/imports/local persistence, screenshots and uninstall preservation. Consult the specific green Actions run for the tested commit. No physical vehicle or scope has been connected.

## Scope and sources

Research checked November 1, 2026. Links identify official sources, not a claim that JH implements their tools or receives their licenses.

- Garrett compressor-map and airflow guidance: https://www.garrettmotion.com/knowledge-center-category/oem/expert/
- TI high-speed differential CAN signal discussion: https://www.ti.com/document-viewer/lit/html/SSZTCN3
- ACDelco TDS subscriptions: https://www.acdelcotds.com/subscriptions
- Ford software/license and coverage guidance: https://www.motorcraftservice.com/Diagnostic/HelmSupport?categoryId=238&channelId=41&country=USA&language=EN-US
- wiTECH Vehicle Reprogramming Subscription: https://kb.fcawitech.com/article/325/vehicle-reprogramming-subscription-40%3Bvrs-41%3B-how-to-965.html
- Mitsubishi OEM tools and application table: https://www.mitsubishitechinfo.com/epacarb/specialtools.jsp and https://www.mitsubishitechinfo.com/epacarb/PCMUpdates.pdf . The latter is a historical 2014 table, not a live latest-calibration service. Its listed 2003 Eclipse 2.4L entries require exact PCM/transmission matching; no unlisted 2004 update is inferred.
- EPA offroad/competition and tampering explanation: https://cleanairnortheast.epa.gov/tampering.html . An offroad/competition description does not itself exempt an originally certified engine. JH does not certify or determine project eligibility.

This release includes no physical ECU write, emissions defeat implementation, security-gateway bypass, automatic module identity mapping or live analog acquisition provider.
