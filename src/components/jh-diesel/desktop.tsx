import {EmissionsWorkbench} from './emissions';
import {AirflowWorkbench} from './engineering';
import {CanMonitor} from './can-monitor';
import {OemUpdates} from './oem-updates';
import { ProgrammingWorkbench } from "./programming";
import { ConnectionWorkbench, CoverageWorkbench, LogWorkbench, TuneWorkbench } from "./workbench";
import { useMemo, useState } from "react";
import {
  Activity, AlertCircle, ArrowDownToLine, ArrowRight, Cable, Check,
  CircleHelp, Cpu, Database, FileClock, FileText, HardDrive, LayoutDashboard,
  Menu, Plug, Radio, RefreshCw, Settings2, ShieldCheck, SlidersHorizontal,
  TerminalSquare, Truck, Usb, Waves, X,
} from "lucide-react";

type Section = "emissions" | "airflow" | "can" | "oem" | "overview" | "connect" | "vehicle" | "diagnostics" | "live" | "calibration" | "files" | "settings" | "coverage";
type InterfaceName = "Nexiq USB-Link 3" | "HP Tuners interface" | "J2534 pass-through" | "JH Link (future)";

const nav: { id: Section; label: string; icon: typeof LayoutDashboard; group: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "WORKSPACE" },
  { id: "connect", label: "Vehicle connection", icon: Cable, group: "WORKSPACE" },
  { id: "vehicle", label: "Projects & programming", icon: Truck, group: "WORKSPACE" },
  { id: "diagnostics", label: "Diagnostics", icon: Activity, group: "ANALYSIS" },
  { id: "live", label: "Logs & graphs", icon: Waves, group: "ANALYSIS" },
  { id: "calibration", label: "Tune planner", icon: SlidersHorizontal, group: "CALIBRATION" },
  { id: "files", label: "File manager", icon: FileClock, group: "CALIBRATION" },
  { id: "coverage", label: "Coverage & explanations", icon: CircleHelp, group: "SYSTEM" },
  { id: "emissions", label: "DEF & emissions", icon: ShieldCheck, group: "CALIBRATION" },
  { id: "airflow", label: "Airflow & fuel sizing", icon: SlidersHorizontal, group: "CALIBRATION" },
  { id: "can", label: "CAN-H / CAN-L", icon: Waves, group: "ANALYSIS" },
  { id: "oem", label: "OEM updates", icon: Cpu, group: "SYSTEM" },
  { id: "settings", label: "Settings", icon: Settings2, group: "SYSTEM" },
];

const supportedVehicles = [
  { year: "2001–2004", engine: "LB7", detail: "6.6L Duramax · controller ID required", module: "ECM / TCM" },
  { year: "2004.5–2005", engine: "LLY", detail: "6.6L Duramax · controller ID required", module: "ECM / TCM" },
  { year: "2006–2007", engine: "LBZ", detail: "6.6L Duramax · controller ID required", module: "ECM / TCM" },
  { year: "2007.5–2010", engine: "LMM", detail: "6.6L Duramax · controller ID required", module: "ECM / TCM" },
  { year: "2011–2016", engine: "LML", detail: "6.6L Duramax · Bosch E86", module: "ECM / TCM" },
  { year: "2017 onward · verify year", engine: "L5P", detail: "6.6L Duramax · controller ID required", module: "ECM / TCM" },
];

const interfaces: { name: InterfaceName; description: string; protocol: string; status: string; icon: typeof Usb }[] = [
  { name: "Nexiq USB-Link 3", description: "RP1210 interface · USB / Bluetooth", protocol: "RP1210 A/B/C/D", status: "Driver required", icon: Usb },
  { name: "HP Tuners interface", description: "VCM hardware · vendor software/SDK", protocol: "Vendor integration", status: "Integration pending", icon: Cpu },
  { name: "J2534 pass-through", description: "Compatible SAE J2534 devices", protocol: "J2534-1 / J2534-2", status: "Driver required", icon: Plug },
  { name: "JH Link (future)", description: "Proprietary JH Diesel hardware", protocol: "CAN / CAN FD", status: "Planned", icon: Radio },
];

function cx(...classes: (string | false | undefined)[]) { return classes.filter(Boolean).join(" "); }
function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" }) {
  return <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium", tone === "good" ? "bg-ok/10 text-ok" : tone === "warn" ? "bg-warn/10 text-warn" : "bg-elevated text-muted")}>{children}</span>;
}
function Panel({ title, eyebrow, action, children, className }: { title: string; eyebrow?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={cx("rounded-xl border border-line bg-surface", className)}><div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4"><div>{eyebrow && <p className="mb-1 text-[10px] font-semibold tracking-[.16em] text-subtle">{eyebrow}</p>}<h2 className="text-sm font-semibold">{title}</h2></div>{action}</div><div className="p-5">{children}</div></section>;
}

export function JHDieselDesktop() {
  const [section, setSection] = useState<Section>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedInterface, setSelectedInterface] = useState<InterfaceName>("Nexiq USB-Link 3");
  const [year, setYear] = useState("2005");
  const [engine, setEngine] = useState("LLY");
  const [vin, setVin] = useState("");
  const [notice, setNotice] = useState("Preview mode · Hardware validation pending. Browser mode supports log analysis and tune proposals only.");
  const active = nav.find((n) => n.id === section)!;
  const vehicle = useMemo(() => `${year} Chevrolet Silverado 2500HD · ${engine} 6.6L Duramax`, [year, engine]);

  function connectAttempt() {
    setNotice("No native adapter service detected. Install the JH Diesel Windows worker and the selected vendor driver to connect hardware.");
  }

  return <div className="min-h-screen bg-bg text-fg">
    <div className="flex min-h-screen">
      <aside className={cx("fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-line bg-sidebar transition-transform lg:static lg:translate-x-0", mobileNav ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-[76px] items-center gap-3 border-b border-line px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-fg"><img src="./jh-logo.png" alt="JH Diesel logo" className="h-10 w-10 rounded-lg object-contain"/></div>
          <div><div className="text-[15px] font-bold tracking-[.08em]">JH DIESEL</div><div className="text-[10px] font-semibold tracking-[.2em] text-muted">CALIBRATION SUITE</div></div>
          <button className="ml-auto rounded-md p-2 text-muted hover:bg-elevated lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={17}/></button>
        </div>
        <div className="px-3 py-5">
          {(["WORKSPACE", "ANALYSIS", "CALIBRATION", "SYSTEM"] as const).map((group) => <div className="mb-5" key={group}>
            <p className="mb-2 px-3 text-[9px] font-bold tracking-[.2em] text-subtle">{group}</p>
            {nav.filter((n) => n.group === group).map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => { setSection(item.id); setMobileNav(false); }} className={cx("mb-1 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] transition-colors", section === item.id ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/60 hover:text-fg")}><Icon size={16} strokeWidth={1.8}/><span className="flex-1">{item.label}</span>{item.id === "connect" && <span className="h-1.5 w-1.5 rounded-full bg-warn"/>}</button>; })}
          </div>)}
        </div>
        <div className="mt-auto border-t border-line p-4">
          <div className="rounded-lg border border-line bg-surface p-3"><div className="mb-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-warn"/><span className="text-xs font-medium">Vehicle not identified</span></div><p className="text-[11px] leading-relaxed text-subtle">Connect an approved interface to begin vehicle diagnostics.</p></div>
          <div className="mt-4 flex items-center justify-between text-[10px] text-subtle"><span>JH Diesel Desktop</span><span>v0.5.0 · Personal edition</span></div>
        </div>
      </aside>
      {mobileNav && <button className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close menu"/>}
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-line bg-bg/95 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3"><button className="rounded-md p-2 text-muted hover:bg-elevated lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={19}/></button><div><p className="text-sm font-semibold">{active.label}</p><p className="text-[11px] text-subtle">JH Diesel · American & Mitsubishi diagnostics development</p></div></div>
          <div className="flex items-center gap-3"><Pill tone="warn"><span className="h-1.5 w-1.5 rounded-full bg-warn"/> Unvalidated</Pill><div className="hidden h-8 w-px bg-line sm:block"/><button onClick={() => setSection("settings")} className="rounded-lg border border-line p-2 text-muted hover:bg-elevated" aria-label="Settings"><Settings2 size={16}/></button></div>
        </header>
        <div className="mx-auto max-w-[1440px] p-4 pb-10 lg:p-8">
          {notice && <div className="mb-5 flex items-start gap-2 rounded-lg border border-warn/20 bg-warn/5 px-4 py-3 text-xs text-muted"><AlertCircle className="mt-0.5 shrink-0 text-warn" size={15}/><span>{notice}</span><button className="ml-auto text-subtle hover:text-fg" onClick={() => setNotice("")} aria-label="Dismiss"><X size={14}/></button></div>}
          {section === "overview" && <>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] font-bold tracking-[.2em] text-accent">WORKSPACE OVERVIEW</p><h1 className="text-2xl font-semibold tracking-tight lg:text-[30px]">Good morning. Ready to diagnose?</h1><p className="mt-2 max-w-xl text-sm text-muted">Your new desktop workspace for American diesel, gas, and automatic transmission systems.</p></div><button onClick={() => setSection("connect")} className="flex h-11 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold text-accent-fg transition hover:opacity-90"><Cable size={15}/> Connect vehicle <ArrowRight size={14}/></button></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[{label:"INTERFACE STATUS",value:"Not connected",sub:"No adapter detected",icon:Usb},{label:"ACTIVE VEHICLE",value:"Not identified",sub:"Select a vehicle profile",icon:Truck},{label:"MODULES ONLINE",value:"—",sub:"Connect to scan modules",icon:Cpu},{label:"SAVED FILES",value:"0",sub:"Local workspace",icon:Database}].map((c) => {const Icon=c.icon;return <div className="rounded-xl border border-line bg-surface p-4" key={c.label}><div className="mb-4 flex items-center justify-between"><span className="text-[9px] font-bold tracking-[.16em] text-subtle">{c.label}</span><Icon size={16} className="text-muted"/></div><p className="text-lg font-semibold">{c.value}</p><p className="mt-1 text-[11px] text-subtle">{c.sub}</p></div>;})}
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
              <Panel eyebrow="GET STARTED" title="Build your first vehicle session" action={<Pill>Step 1 of 3</Pill>}>
                <div className="space-y-4">{[{n:"01",title:"Choose a vehicle profile",desc:"Start with a GM Duramax engine family and transmission."},{n:"02",title:"Select your communication interface",desc:"Nexiq RP1210, HP Tuners hardware, or J2534 pass-through."},{n:"03",title:"Run a read-only module scan",desc:"Identify supported controllers, read DTCs, and inspect live data."}].map((s,i)=><div className="flex gap-4" key={s.n}><div className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold",i===0?"bg-accent text-accent-fg":"bg-elevated text-muted")}>{s.n}</div><div className="flex-1 border-b border-line pb-4 last:border-0 last:pb-0"><p className="text-sm font-semibold">{s.title}</p><p className="mt-1 text-xs text-muted">{s.desc}</p></div></div>)}</div>
                <div className="mt-5 flex flex-wrap gap-2"><button onClick={() => setSection("vehicle")} className="h-10 rounded-lg bg-accent px-4 text-xs font-bold text-accent-fg">Set up vehicle</button><button onClick={() => setSection("connect")} className="h-10 rounded-lg border border-line px-4 text-xs font-semibold hover:bg-elevated">Configure interface</button></div>
              </Panel>
              <Panel eyebrow="FIRST DEVELOPMENT TARGET" title="GM 6.6L Duramax research targets">
                <p className="mb-4 text-xs leading-relaxed text-muted">The first vehicle family is organized by engine generation. Controller-specific coverage will be enabled only after protocol and calibration definitions are validated.</p>
                <div className="space-y-2">{supportedVehicles.map((v) => <div className="flex items-center justify-between gap-3 rounded-lg bg-elevated/60 px-3 py-2.5" key={v.engine}><div><p className="text-xs font-semibold">{v.engine} <span className="ml-1 font-normal text-muted">{v.year}</span></p><p className="mt-0.5 text-[10px] text-subtle">{v.detail}</p></div><span className="text-[10px] text-muted">{v.module}</span></div>)}</div>
              </Panel>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              {[{icon:ShieldCheck,title:"Compliance-first",desc:"Preserve required emissions systems and factory diagnostic monitoring."},{icon:HardDrive,title:"Local-first files",desc:"Keep original reads, working copies, and revision history separated."},{icon:TerminalSquare,title:"Extensible hardware",desc:"A native Windows service will isolate vendor drivers from the desktop UI."}].map((v)=><div className="rounded-xl border border-line bg-surface p-4" key={v.title}><v.icon size={18} className="mb-3 text-accent"/><p className="text-sm font-semibold">{v.title}</p><p className="mt-1 text-xs leading-relaxed text-muted">{v.desc}</p></div>)}
            </div>
          </>}

          {section === "emissions" && <EmissionsWorkbench/>}
          {section === "airflow" && <AirflowWorkbench/>}
          {section === "can" && <CanMonitor/>}
          {section === "oem" && <OemUpdates/>}
          {section === "coverage" && <CoverageWorkbench/>}
          {section === "connect" && <><ConnectionWorkbench/>
            <div className="mb-6"><p className="mb-2 text-[10px] font-bold tracking-[.2em] text-accent">COMMUNICATION LAYER</p><h1 className="text-2xl font-semibold">Vehicle connection</h1><p className="mt-2 text-sm text-muted">Choose the interface and communication stack used to connect to a vehicle.</p></div>
            <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
              <Panel title="Available interface families" eyebrow="HARDWARE" action={<Pill tone="warn">No devices detected</Pill>}>
                <div className="space-y-3">{interfaces.map((d)=>{const Icon=d.icon;return <button key={d.name} onClick={()=>setSelectedInterface(d.name)} className={cx("flex w-full items-center gap-4 rounded-xl border p-4 text-left transition",selectedInterface===d.name?"border-accent/50 bg-elevated":"border-line bg-bg hover:bg-elevated/50")}><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-elevated text-muted"><Icon size={18}/></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{d.name}</p><p className="mt-1 text-[11px] text-muted">{d.description}</p><p className="mt-1 font-mono text-[10px] text-subtle">{d.protocol}</p></div><div className="text-right"><Pill tone={d.status==="Planned"?"neutral":"warn"}>{d.status}</Pill>{selectedInterface===d.name&&<Check className="ml-auto mt-2 text-accent" size={15}/>}</div></button>})}</div>
                <div className="mt-5 flex flex-wrap gap-2"><button onClick={connectAttempt} className="flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold text-accent-fg"><RefreshCw size={14}/> Detect hardware</button><button onClick={()=>setNotice("Driver setup checklist: install the adapter manufacturer's signed Windows driver, verify device visibility in Device Manager, then restart the JH Diesel communication service.")} className="h-10 rounded-lg border border-line px-4 text-xs font-semibold hover:bg-elevated">Driver setup guide</button></div>
              </Panel>
              <Panel title="Connection requirements" eyebrow="SELECTED INTERFACE">
                <p className="text-sm font-semibold">{selectedInterface}</p><p className="mt-1 text-xs text-muted">{interfaces.find(i=>i.name===selectedInterface)?.description}</p>
                <div className="my-5 space-y-3">{[{name:"Windows vendor driver",detail:"Signed manufacturer driver installed"},{name:"JH Diesel communication service",detail:"Isolated worker available"},{name:"Vehicle interface",detail:"USB / Bluetooth device enumerated"},{name:"Vehicle power and DLC",detail:"Stable vehicle battery and DLC connection"}].map((r,i)=><div className="flex items-start gap-3" key={r.name}><span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-line text-[9px] text-subtle">{i+1}</span><div><p className="text-xs font-medium">{r.name}</p><p className="mt-0.5 text-[10px] text-subtle">{r.detail}</p></div></div>)}</div>
                <div className="rounded-lg border border-line bg-bg p-3"><div className="flex items-center gap-2 text-xs font-semibold"><CircleHelp size={14} className="text-muted"/> No direct hardware access in preview</div><p className="mt-2 text-[11px] leading-relaxed text-muted">The production Windows build uses a isolated local worker. This browser preview will not pretend a physical adapter is connected.</p></div>
              </Panel>
            </div>
            <Panel title="Communication protocols" eyebrow="SUPPORTED ADAPTER TARGETS" className="mt-5">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{[{p:"RP1210 A/B/C/D",d:"Nexiq and heavy-duty adapter abstraction"},{p:"SAE J2534",d:"Pass-through device abstraction"},{p:"CAN / CAN FD",d:"ISO 11898 network transport"},{p:"J1939",d:"Heavy-duty diagnostics and data"},{p:"ISO 15765",d:"OBD-II CAN diagnostics"},{p:"J1708 / J1587",d:"Legacy heavy-duty networks"},{p:"J1850 / ISO 9141",d:"Legacy light-duty networks"},{p:"DoIP",d:"Diagnostics over Ethernet"}].map(p=><div key={p.p} className="rounded-lg bg-elevated/60 p-3"><p className="font-mono text-xs font-semibold">{p.p}</p><p className="mt-1 text-[10px] text-muted">{p.d}</p></div>)}</div>
            </Panel>
          </>}

          {section === "vehicle" && <ProgrammingWorkbench/>}

          {section === "diagnostics" && <><div className="mb-6"><p className="mb-2 text-[10px] font-bold tracking-[.2em] text-accent">READ-ONLY WORKFLOW</p><h1 className="text-2xl font-semibold">Diagnostics</h1><p className="mt-2 text-sm text-muted">Module discovery, diagnostic trouble codes, and controller identification.</p></div><div className="grid gap-4 sm:grid-cols-3">{[{t:"Module scan",d:"Discover supported vehicle controllers",i:Cpu},{t:"Trouble codes",d:"Read and document DTC status",i:AlertCircle},{t:"Module information",d:"Hardware, software and calibration IDs",i:FileText}].map(x=><div className="rounded-xl border border-line bg-surface p-5" key={x.t}><x.i size={18} className="mb-4 text-accent"/><p className="text-sm font-semibold">{x.t}</p><p className="mt-1 text-xs text-muted">{x.d}</p><Pill tone="warn">Waiting for connection</Pill></div>)}</div><Panel title="Diagnostic session" eyebrow="NO ACTIVE VEHICLE" className="mt-5"><div className="flex flex-col items-center py-8 text-center"><Activity size={26} className="mb-3 text-subtle"/><p className="text-sm font-semibold">Connect an interface to begin</p><p className="mt-2 max-w-md text-xs text-muted">The application will not fabricate DTCs or module responses. Connect a supported device through the Windows communication service to enable diagnostic requests.</p><button onClick={()=>setSection("connect")} className="mt-5 h-10 rounded-lg bg-accent px-4 text-xs font-bold text-accent-fg">Configure connection</button></div></Panel></>}

          {section === "live" && <LogWorkbench/>}
          {section === "calibration" && <TuneWorkbench/>}

          {section === "files" && <><div className="mb-6"><p className="mb-2 text-[10px] font-bold tracking-[.2em] text-accent">LOCAL WORKSPACE</p><h1 className="text-2xl font-semibold">File manager</h1><p className="mt-2 text-sm text-muted">Keep originals, working copies, logs, and reports organized by vehicle.</p></div><Panel title="Vehicle files" eyebrow="LOCAL LIBRARY" action={<Pill>0 files</Pill>}><div className="flex flex-col items-center py-8 text-center"><Database size={26} className="mb-3 text-subtle"/><p className="text-sm font-semibold">Your workspace is empty</p><p className="mt-2 text-xs text-muted">Imported files and diagnostic reports will appear here, grouped by VIN and controller ID.</p></div></Panel></>}

          {section === "settings" && <><div className="mb-6"><p className="mb-2 text-[10px] font-bold tracking-[.2em] text-accent">APPLICATION CONFIGURATION</p><h1 className="text-2xl font-semibold">Settings</h1><p className="mt-2 text-sm text-muted">Desktop runtime, interface providers, storage, and diagnostics.</p></div><div className="grid gap-5 lg:grid-cols-2"><Panel title="Desktop runtime" eyebrow="APPLICATION"><div className="space-y-3 text-xs"><div className="flex justify-between"><span className="text-muted">UI runtime</span><span>React desktop shell</span></div><div className="flex justify-between"><span className="text-muted">Target OS</span><span>Windows 10 / 11 · x64</span></div><div className="flex justify-between"><span className="text-muted">Native bridge</span><Pill tone="warn">Development only</Pill></div><div className="flex justify-between"><span className="text-muted">Data storage</span><span>Local profile (preview)</span></div></div></Panel><Panel title="Provider configuration" eyebrow="COMMUNICATION"><div className="space-y-3">{interfaces.map(i=><div key={i.name} className="flex items-center justify-between gap-2 text-xs"><span>{i.name}</span><Pill>{i.status}</Pill></div>)}</div></Panel></div></>}
        </div>
      </main>
    </div>
  </div>;
}
