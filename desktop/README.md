# Desktop development

See the root README-JH-DIESEL.md. The Electron preload routes four operations to `native-worker.cjs`, which serializes requests into the isolated Python worker. The worker has no network listener and does not expose ECU programming operations.

Build: `npm run desktop:build`; launch: `npm run desktop:built`. In development, `npm run desktop:dev` connects to the separately running web development renderer. No signed installer is supplied. The old C# provider records remain an unwired design reference.
