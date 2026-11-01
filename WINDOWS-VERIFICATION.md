# Windows verification

The Windows installer workflow builds version 0.4 from the saved source package, runs TypeScript, log and native-service tests, installs the application, launches the installed executable through Playwright, verifies the bundled Python worker using driver discovery only, visits application screens, records screenshots and logs, and uninstalls while preserving a test user file.

See Actions > Windows installer verification. A green run is required before describing the installer as verified by this workflow. No physical adapter, vehicle communication or ECM programming is tested. The unsigned development installer is uploaded only after the checks pass.

The embedded OAuth preview credential has been removed. Optional browser authentication must receive credentials through environment configuration. The standalone desktop app does not use this OAuth configuration.

Two browser-only assets (public/__grok/install/assets/homescreen/ob-phone.png and public/og.jpg) are omitted from this import because automatic public-upload review blocked them. Neither is used by the standalone desktop renderer. The original source archive retains these assets.
