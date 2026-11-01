# v0.4 installer and personal GM projects

This release packages the application as a Windows x64 NSIS installer, with bundled Electron, Python 3.13.17 x86 and an unmodified official PCM Hammer 2.0.0 companion. It adds persistent engine/controller/transmission projects, a manual/planned-swap dropdown and local raw-binary SHA-256 inspection. No JH credit/account/activation system exists.

The installer uses a custom per-user NSIS script, desktop/Start menu shortcuts and Add/Remove Programs registration. Its generated uninstaller removes only packaged file paths and shortcuts; local projects and drafts are retained. The Windows binaries are unsigned. No auto-updater or elevated system service is installed. Vendor drivers remain separate.

## Programming scope

Confirmed P01/P59 gasoline projects can open the included independent PCM Hammer application. That upstream release has full read/calibration/full-write support for applicable P01/P59 controllers. JH does not translate prompts or its checkboxes into binary modifications, implement a new flash engine, or start an external write. The user verifies and performs supported operations in PCM Hammer. No physical adapter/controller combination has been tested in this environment.

The requested 2005 LLY, Allison, 4L60E/4L80E and future manual configuration are represented as projects. LLY ECM and Allison TCM programming remain unimplemented. A 1999–2007 engine/year range does not imply every controller is P01/P59. Integrated transmission-control segments and standalone TCMs need different handling. Manual selection records a project only and does not change a ROM.

## Validation

TypeScript checking, web and desktop builds, CSV tests, Python worker tests, JavaScript syntax checks and companion family/platform guard checks pass. The official PCM Hammer archive digest matches GitHub release metadata; Python's embed ZIP digest matches its official release page. The official companion Windows executable, dependent files and P01 kernel were inspected in the archive. The same tag's corresponding source archive, license and notices are included.

Windows install/uninstall, the app GUI, companion extraction/launch, NEXIQ compatibility and physical flash operations are untested. This is an unsigned development build. Passing packaging and source tests is not vehicle validation.

The v0.3 README/research describe the earlier foundation. For current installation and capability status, use INSTALLER-README.md and this release note.
