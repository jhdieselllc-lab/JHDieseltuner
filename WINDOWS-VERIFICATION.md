# Windows verification

The Windows installer workflow builds the version declared in package.json from the repository source. It runs TypeScript, log, engineering, CAN capture, OEM-link and native-service checks; installs the application; launches the installed executable through Playwright; verifies bundled Python driver discovery; exercises application screens, imports and local persistence; records screenshots and logs; and uninstalls while preserving a test user file.

See Actions > Windows installer verification. Use a green run for the exact commit you install. No physical adapter, scope, vehicle communication or ECM programming is tested. The unsigned development installer is uploaded only after the checks pass.

Optional browser authentication must receive credentials through environment configuration. The standalone desktop app does not use that OAuth configuration.

Two browser-only assets (public/__grok/install/assets/homescreen/ob-phone.png and public/og.jpg) were omitted from the initial import because automatic public-upload review blocked them. Neither is used by the standalone desktop renderer. The original source archive retains these assets.
