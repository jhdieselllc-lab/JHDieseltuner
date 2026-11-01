# JH Diesel Communication Service (Windows)

This folder is the native Windows integration boundary for the desktop application.

## Initial scope
- Windows service / local IPC host, installed separately and signed.
- Adapter discovery and vendor driver version reporting.
- Provider contracts for RP1210 (Nexiq USB-Link 3), J2534 pass-through, and future JH Link hardware.
- Read-only diagnostic operations first: interface discovery, protocol capability discovery, ECU/TCM identification, DTC reads, and live-data requests.
- Explicit per-controller capability manifests. A transport protocol being available does not imply a specific ECU/TCM definition is supported.

## Provider contracts
Implement provider adapters against vendor-published RP1210 and SAE J2534 APIs. Do not load vendor DLLs into the renderer or Electron main process. Keep vendor calls in this isolated service and validate all IPC messages. HP Tuners support must use an authorized integration path and published SDK/API; do not reverse engineer or bypass device security.

## Safety boundary
The initial service is read-only. Do not add ECU/TCM write, reflash, security bypass, emissions-delete, emissions-monitor defeat, or diagnostic suppression commands. Future lawful programming support requires a separate reviewed design, explicit OEM/vendor authorization, controller-specific validation, power-loss recovery, and audit logging.

## Vendor dependencies
No vendor SDKs, driver packages, credentials, or redistributable DLLs are bundled. Obtain them from the respective manufacturers and comply with their licensing terms.
