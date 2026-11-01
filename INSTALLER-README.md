# JH Diesel Personal Edition 0.4.0

Windows 10/11 x64 installer. Run JH-Diesel-Setup-0.4.0.exe, choose your install folder, then launch the JH Diesel shortcut. No Node.js or standalone Python installation is needed. NEXIQ vendor drivers are installed separately from NEXIQ. The included worker uses embedded 32-bit Python for RP1210 drivers of matching architecture.

This is an unsigned development installer. Windows may show an unknown publisher warning. It has been built and statically inspected on Linux; Windows installation, application launch, adapters and physical ECM programming have not been tested here.

## Your requested projects

Use Projects & programming to select the 2005 LLY or 1999–2007 GM 5.3/6.0 target. Save Allison 5/6-speed, 4L60E, 4L80E, or manual as the transmission/planned swap. This is a saved project profile. It does not change wiring, control segments, OS or hardware. A manual conversion requires a compatible calibration and physical installation, not just a dropdown selection. Distinguish 2007 Classic from new-body vehicles.

## Full-write capability: scope

The installed app can launch the unmodified official PCM Hammer 2.0.0 release, separately identified as a companion. Confirm a supported P01/P59 gasoline controller in the vehicle project. The companion supports upstream full-read/calibration/full-write operations for applicable P01/P59 PCMs. JH does not implement or automate that flash protocol. A full-write operation is initiated and completed in PCM Hammer; the JH screen does not report flash success.

Read controller properties first, preserve the complete original read, match the hardware/OS and file, and use appropriate stable programming power. Use the companion's test-write/check procedures where applicable before an actual write. Have a recovery plan. Do not interpret a .bin file-size match or SHA-256 as compatibility verification.

The included tool needs the .NET Framework runtime required by that release (upstream documentation lists .NET Framework 4.6.2); supported Windows 10/11 installations commonly have a later compatible 4.x version. If Windows reports it missing, obtain it from Microsoft. This installer does not modify .NET or install adapter drivers.

No JH credits, subscription, account, activation or per-VIN fee is used. PCM Hammer is an independent project. Hardware purchases and other vendors' licenses remain separate. NEXIQ USB-Link 3 plus PCM Hammer is not validated by this build; use an interface supported by the companion and verify actual VPW communication.

**Not included:** LLY ECM full read/write, Allison TCM programming, separate 4L60E/4L80E TCM programming, automatic manual-transmission calibration conversion, generic 1999–2007 support, E90/E46 unlocking, or emissions-delete implementation. 1999–2007 engine displacement/year alone does not identify the PCM.

## Other features

CSV log graphing and export; explained checkbox tune proposals; local project/draft save; experimental receive-only RP1210 discovery/capture; raw .bin size and SHA-256 fingerprinting. No AI-generated ROM changes are created.

## Companion provenance, notices and source

Official release: https://github.com/PcmHammer/PcmHammer/releases/tag/2.0.0
Official ZIP: PCMHammer_2.0.0_Portable.zip
Verified SHA-256: b4b24fdede9e61877273c3f020d881589ac05987524006b23d3ff081670beb04
Corresponding source archive, license and third-party notices accompany the original ZIP in resources/companions. The complete official release is extracted to the application's user-data companion folder to run; it is not patched, rebranded or linked into JH. PCM-executed portions have separate upstream redistribution terms; see the included LICENSE. The rest is GPLv3 as stated upstream. No warranty is provided by that project.

Python 3.13.17 embeddable x86 is redistributed with its original license. Electron and Chromium notices are included by the packager. JH is not affiliated with these projects, GM, NEXIQ, HP Tuners or EFILive.

Research references:
- https://pcmhammer.github.io/users/
- https://pcmhammer.github.io/users/supported-devices
- https://github.com/PcmHammer/PcmHammer/tree/2.0.0
- https://www.efilive.com/gm-diesel-scan-and-tune
- https://www.efilive.com/tcm-tuning
