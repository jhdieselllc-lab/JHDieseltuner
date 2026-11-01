export type AirInput = {
  liters: number; rpm: number; ve: number; boostPsi: number; baroPsi: number;
  chargeC: number; inletC: number; inletLossPsi: number; outletLossPsi: number;
  efficiency: number; referenceC: number; referencePsi: number;
};
function positive(value: number, label: string, allowZero = false) {
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) throw Error(`${label} must be ${allowZero ? 'nonnegative' : 'positive'}.`);
}
export function airflow(p: AirInput) {
  for (const key of ['liters','rpm','ve','baroPsi','efficiency','referencePsi'] as const) positive(p[key], key);
  for (const key of ['boostPsi','inletLossPsi','outletLossPsi'] as const) positive(p[key],key,true);
  if (p.ve > 1.5 || p.efficiency > 1) throw Error('Use VE up to 150% and compressor efficiency up to 100%.');
  for (const key of ['chargeC','inletC','referenceC'] as const) if (!Number.isFinite(p[key]) || p[key] <= -273.15) throw Error('Temperatures must exceed absolute zero.');
  const inletPsi=p.baroPsi-p.inletLossPsi;
  positive(inletPsi,'Compressor inlet absolute pressure');
  const mapPsi=p.baroPsi+p.boostPsi;
  const pressureRatio=(mapPsi+p.outletLossPsi)/inletPsi;
  const manifoldM3s=p.liters/1000*p.rpm/120*p.ve;
  const kgS=manifoldM3s*(mapPsi*6894.757293)/(287.05*(p.chargeC+273.15));
  const lbMin=kgS*132.2773573;
  const result = {
    manifoldCfm:manifoldM3s*2118.880003, lbMin, mapPsi, pressureRatio,
    standardCfm:kgS/(101325/(287.05*288.15))*2118.880003,
    correctedLbMin:lbMin*Math.sqrt((p.inletC+273.15)/(p.referenceC+273.15))/(inletPsi/p.referencePsi),
    outletC:(p.inletC+273.15)*(1+(pressureRatio**(2/7)-1)/p.efficiency)-273.15,
  };
  if(!Object.values(result).every(Number.isFinite))throw Error('Inputs exceed the airflow calculation range.');
  return result;
}
export function wheelTrim(inducerMm: number, exducerMm: number) {
  positive(inducerMm,'Inducer diameter');positive(exducerMm,'Exducer diameter');
  if (inducerMm>exducerMm) throw Error('Compressor inducer must not exceed its exducer.');
  return 100*(inducerMm/exducerMm)**2;
}
export function fuelSizing(p:{hp:number;bsfc:number;count:number;duty:number;ratedLbHr:number;ratedDeltaPsi:number;actualDeltaPsi:number;densityGcc:number;rpm:number;cylinders:number}) {
  for(const [key,value] of Object.entries(p)) positive(value,key);
  if(!Number.isInteger(p.count)||!Number.isInteger(p.cylinders)||p.duty>1) throw Error('Injector/cylinder counts must be whole numbers and duty must be at most 100%.');
  const fuelLbHr=p.hp*p.bsfc;
  const requiredEachLbHr=fuelLbHr/(p.count*p.duty);
  const availableEachLbHr=p.ratedLbHr*Math.sqrt(p.actualDeltaPsi/p.ratedDeltaPsi);
  const result={fuelLbHr,requiredEachLbHr,availableEachLbHr,
    requiredEachCcMin:requiredEachLbHr*453.59237/(60*p.densityGcc),
    supportedCrankHp:availableEachLbHr*p.count*p.duty/p.bsfc,
    dieselMgCycle:fuelLbHr*453592.37/60/(p.rpm/2*p.cylinders)};
  if(!Object.values(result).every(Number.isFinite))throw Error('Inputs exceed the fuel calculation range.');
  return result;
}

export type VoltageSample={time_us:number;can_h_v:number;can_l_v:number;diff_v:number;common_v:number};
export function parseCanVoltage(text:string):VoltageSample[] {
  const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
  if(lines[0]?.trim()!=='time_us,can_h_v,can_l_v') throw Error('Expected header: time_us,can_h_v,can_l_v');
  if(lines.length<3||lines.length>50001) throw Error('Use 2–50,000 voltage samples.');
  return lines.slice(1).map((line,i)=>{
    const cells=line.split(',').map(s=>s.trim());
    if(cells.length!==3||cells.some(s=>!s||!Number.isFinite(Number(s))))throw Error(`Invalid voltage sample on line ${i+2}.`);
    const [time_us,can_h_v,can_l_v]=cells.map(Number);
    if(time_us<0||(i>0&&time_us<=Number(lines[i].split(',')[0])))throw Error('Sample times must be nonnegative and strictly increasing.');
    if(Math.abs(can_h_v)>100||Math.abs(can_l_v)>100)throw Error('Voltage exceeds the viewer range of ±100 V; check units.');
    return {time_us,can_h_v,can_l_v,diff_v:can_h_v-can_l_v,common_v:(can_h_v+can_l_v)/2};
  });
}
export type CanFrame={time_ms:number;can_id:string;data_hex:string};
export function parseCanFrames(text:string):CanFrame[] {
  const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
  if(lines[0]?.trim()!=='time_ms,can_id,data_hex'||lines.length<2||lines.length>10001)throw Error('Use time_ms,can_id,data_hex and 1–10,000 data frames.');
  let previous=-Infinity;
  return lines.slice(1).map((line,i)=>{
    const c=line.split(',').map(s=>s.trim());
    if(c.length!==3||!c[0]||!Number.isFinite(Number(c[0]))||Number(c[0])<0||Number(c[0])<previous||! /^(?:0x)?[0-9a-f]{1,8}$/i.test(c[1])||parseInt(c[1].replace(/^0x/i,''),16)>0x1fffffff||! /^(?:[0-9a-f]{2}){0,64}$/i.test(c[2]))throw Error(`Invalid data frame on line ${i+2}. Use hexadecimal CAN IDs and 0–64 payload bytes.`);
    if(![0,1,2,3,4,5,6,7,8,12,16,20,24,32,48,64].includes(c[2].length/2))throw Error(`Invalid CAN/CAN FD payload length on line ${i+2}.`);
    previous=Number(c[0]);return {time_ms:previous,can_id:'0x'+parseInt(c[1].replace(/^0x/i,''),16).toString(16).toUpperCase(),data_hex:c[2].toUpperCase()};
  });
}
export function canInventory(frames:CanFrame[]) {
  const inventory=new Map<string,{id:string;count:number;lastMs:number;maxGapMs:number;bytes:number}>();
  for(const f of frames){const old=inventory.get(f.can_id);inventory.set(f.can_id,{id:f.can_id,count:(old?.count||0)+1,lastMs:f.time_ms,maxGapMs:old?Math.max(old.maxGapMs,f.time_ms-old.lastMs):0,bytes:f.data_hex.length/2});}
  return [...inventory.values()].sort((a,b)=>parseInt(a.id,16)-parseInt(b.id,16));
}
