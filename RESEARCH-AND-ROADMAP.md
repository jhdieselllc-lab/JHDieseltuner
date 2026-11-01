# JH Diesel v0.3 — protocol research and implementation status

Research checked November 1, 2026. This is a foundation release and a first-pass cross-platform research map, not an exhaustive reverse engineering study of every American vehicle. No physical adapter or vehicle was available. No vehicle/controller is certified as supported by JH yet.

## What is implemented

- Your supplied logo appears in the desktop workspace.
- An Electron preload exposes only discovery, open-client, bounded capture and disconnect operations. Native driver calls run in a separate Python process, with serialized JSON-line requests, a timeout and cleanup.
- RP1210 registration discovery parses the Windows master/vendor INI files and returns device IDs and advertised protocols. This detects installed registrations, not USB attachment or a vehicle.
- Experimental RP1210 client connect/disconnect, pass-all receive filtering, and nonblocking raw message capture for vendor-advertised CAN/J1939/J1708. No application message transmission, security access, ROM read/write, DTC clear or flash path is exposed. The interface/driver may still participate electrically in network acknowledgments; this is not a guaranteed listen-only bus monitor.
- Raw captures preserve adapter timestamps as raw values. Their units are not assumed. Payloads remain opaque until the relevant vendor layout and controller profile are validated.
- Numeric CSV import/export, independent channel graphs, time-window filtering and min/mean/max statistics. Demo data is explicitly synthetic. Graphs are decimated for display; statistics and exports retain all samples in the window.
- Checkbox-based tune proposals with explanations and prerequisites, local draft save and JSON export. Prompt input formats a review request; it does not call an AI model, generate numerical calibration changes or modify binaries.
- A separate static desktop renderer build replaces the starter's nonexistent production HTML target. Source and renderer are supplied; no signed Windows installer is supplied.

## Protocol layers: keep these separate

1. Physical wiring and transport: DLC pinout, electrical levels, baud rate, CAN identifiers, CAN FD, K-line, J1850, Ethernet.
2. Adapter API: RP1210 or J2534 calls to a vendor driver. It does not provide controller-specific tune maps.
3. Diagnostic application: generic OBD services, manufacturer-specific diagnostics, UDS or J1939. ISO-TP handles segmented diagnostic messages on applicable CAN networks. J1939 uses different framing and transport conventions.
4. Calibration description: exact hardware/OS match, memory layout, scalar/table addresses, axes, byte order, signedness, engineering-unit scaling, bounds, dependent maps and checksum/signature handling.
5. Programming: controller-specific session handling, authorized security access, erase/download procedures and recovery. A successful diagnostic read is not evidence that programming is supported.

The tuning interface should expose plain-language intent above these layers, while retaining exact units and provenance. For example, MAP is absolute manifold pressure; it is not automatically gauge boost. A checkbox must resolve to version-matched definitions, not an assumed universal byte patch.

## NEXIQ USB-Link 3

NEXIQ lists RP1210 a/b/c/d and a commercial-vehicle-focused partial J2534 implementation. The published network list includes CAN FD, DoIP and legacy links. Those claims establish adapter targets, not universal OEM programming compatibility. Actual driver version, API bitness, cable pinout and OEM application acceptance must be tested.

Primary sources:
- [NEXIQ wired USB-Link 3 specifications](https://www.nexiq.com/Shopping/Product_GEX.aspx?ProductNumber=NQ121054)
- [NEXIQ CAN FD / DoIP driver announcement](https://www.nexiq.com/Nexiq/Article_GEX.aspx?NewsId=1)
- [Kvaser RP1210 API overview](https://kvaser.com/about-can/can-standards/rp1210/)

The next hardware milestone is a Windows bench session: inventory driver registrations, verify actual DLL architecture, connect to a powered adapter, compare captured traffic with vendor tools, verify timestamps/error behavior, then disconnect/reconnect repeatedly. Disconnect, unplug, missing-driver, wrong-bitness and hung-vendor-call cases must be exercised. The unit tests do not substitute for this.

## Coverage research map

| Family | Research direction | Required evidence before enabling |
|---|---|---|
| GM legacy gasoline / Duramax | Class 2/J1850 and CAN variants; ECM/TCM generations vary | Exact year/RPO, hardware, OS/calibration IDs, pinout and OEM service information |
| GM modern gasoline / diesel | Controller-specific CAN diagnostics; architecture and security vary | Global A/B identification, gateway requirements, authorized programming route |
| Ford / Lincoln | Legacy and modern transport families; OEM tool selection by model | VIN/module applicability, validated J2534 device and OEM software requirements |
| Ram / Dodge / Chrysler / Jeep | Legacy diagnostics plus CAN/ISO-TP and gateway restrictions where applicable | Exact module part/software numbers, service information and authorized access |
| Commercial/farm engines | J1939 or J1708/J1587 when actually fitted | OEM network diagram, source addresses, signal definitions and engine/controller IDs |
| Mitsubishi 2.4L | Separate 4G64, 4G69, 4B12 and other model/market variants | Model/year/market, engine, ECU part/processor and ROM ID, read/write compatibility and matching definitions |

These are investigative categories, not model-year guarantees. The starter's blanket Bosch EDC16 labels were removed because they were not verified. Its manual vehicle profile is still GM-focused; the matrix does not add universal vehicle support.

SAE describes J2534 as an interface used by manufacturer software to control reprogramming, rather than a universal calibration editor. Ford's OEM support pages and Stellantis' J2534 instructions likewise remain vehicle/application-specific. Stellantis explicitly describes matching current software part numbers to applicable updates.

Primary sources:
- [SAE J2534-1 scope](https://saemobilus.sae.org/standards/j2534-1_5_00-recommended-practice-pass-thru-vehicle-programming)
- [Ford OEM diagnostic support](https://www.motorcraftservice.com/Diagnostic/HelmSupport?categoryId=244&channelId=31&country=USA&language=EN-US)
- [Stellantis J2534 flash availability](https://kb.fcawitech.com/print-699.html)
- [Kvaser J1939 overview](https://kvaser.com/about-can/higher-layer-protocols/j1939-introduction/)
- [CAN in Automation: UDS/ISO-TP discussion](https://www.can-cia.org/fileadmin/cia/documents/publications/cnlm/september_2023/23-3_cnlm.pdf)

Tactrix distinguishes read/reflash support, editable ROM definitions, and logging support. Its general Mitsubishi coverage cannot establish that a particular 2.4L ROM is editable. The project needs an individually verified ROM definition for each supported software variant.

- [Tactrix compatibility explanation](https://www.tactrix.com/index.php?FontSize=font-medium&Itemid=53&catid=40%3Aecuflash&id=69%3Awhat-cars-work-with-ecuflash&option=com_content&view=article)

## GM E90 and E46: findings and limits

E90 is not one interchangeable unlock target. HP Tuners documents a Global A upgrade-kit workflow using specific hardware/software; it separately advertises a Global B E90/E93 send-in service. These are vendor-supported paths, not evidence of a public NEXIQ unlock API. JH has no verified box-free E90 procedure.

The Global B product page has inconsistent interface wording between sections. Confirm exact vehicle/interface requirements with the vendor rather than implementing from the marketing page alone.

- [HP Tuners Global A E90 upgrade instructions](https://docs.hptuners.com/E90_%26_T93_Upgrade_Kit/)
- [HP Tuners Global B E90/E93 service](https://www.hptuners.com/product/gm-e90-e93-ecm-service-global-b/)

HP Tuners lists its E46 service for specified 2020–2022 non-Global-B Silverado/Sierra LM2 applications, requiring the original controller to be sent in. It states that other tuning tools cannot use that upgraded controller, excluding dealer reflash tools. Therefore its upgrade must not be advertised as compatible with JH or NEXIQ. No E46 unlock implementation is included.

- [HP Tuners E46 service and restrictions](https://www.hptuners.com/product/gm-e46-ecm-service/)

## Emissions configuration

No DEF/SCR/DPF/EGR disable implementation is included. EPA guidance for certified nonroad engines describes tampering restrictions; describing a vehicle as farm/off-road equipment does not itself establish an exemption. Training and a test result for another calibration do not demonstrate that a proposed changed configuration is covered. A specific exemption or certification claim needs its own documentary review, including the exact engine and tested configuration.

- [EPA nonroad owner/operator questions](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P100U8YP.TXT)
- [EPA tampering enforcement policy](https://www.epa.gov/sites/production/files/2020-12/documents/epatamperingpolicy-enforcementpolicyonvehicleandenginetampering.pdf)

## Ordered development milestones

1. Validate the native worker against the actual Windows/NEXIQ setup. Sign/package the worker and restrict renderer origins for distribution. This development source is not a hardened Windows service.
2. Implement one verified diagnostic profile: supported transport/addressing, request timeouts, response validation, negative responses, segmented-message handling, module identity and generic DTC/live-data decoding. Do not infer ECM vs TCM from an unverified address.
3. Add recording through a bounded polling/subscription pipeline, monotonic host time, adapter timestamp metadata, channel units, sample age/quality and dropped-sample reporting. The current capture button collects one bounded raw batch, not continuous decoded logging.
4. Select one exact GM controller/OS with licensed definitions and known recovery. Preserve immutable originals and file hashes; evaluate dependent parameters and checksums before preparing a change set. Test interrupted programming on a recoverable bench before any vehicle write capability.
5. Add prompt-to-proposal assistance using only known parameters and explicit units. Unknown requests remain questions; numerical changes require definition validation and review. Never let prompt text select raw memory addresses or native commands.
6. Expand per validated controller/OS, rather than enabling entire brands by a checkbox. Mitsubishi 2.4L needs its own first concrete vehicle/ROM target.

## Verification record

Passed: TypeScript checking; web production build; native Python compile and JavaScript syntax checks; four CSV validation tests; four native registration/operation/worker tests. Windows DLL invocation and physical vehicle communication were not tested. See release README for final desktop build and browser QA status.
