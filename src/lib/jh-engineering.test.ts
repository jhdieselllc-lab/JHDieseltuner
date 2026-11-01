import {test} from 'node:test';
import assert from 'node:assert/strict';
import {airflow,fuelSizing,wheelTrim,parseCanVoltage,parseCanFrames,canInventory} from './jh-engineering.ts';
const air={liters:2.4,rpm:6000,ve:1,boostPsi:0,baroPsi:14.6959494,chargeC:15,inletC:15,inletLossPsi:0,outletLossPsi:0,efficiency:.75,referenceC:15,referencePsi:14.6959494};
test('four-stroke displacement and ideal-gas reference produce 254 CFM at standard conditions',()=>{
 const r=airflow(air);assert.ok(Math.abs(r.manifoldCfm-254.2656)<.01);assert.ok(Math.abs(r.standardCfm-r.manifoldCfm)<.01);assert.equal(r.pressureRatio,1);assert.ok(Math.abs(r.outletC-15)<1e-10);
 const boosted=airflow({...air,boostPsi:air.baroPsi});assert.ok(Math.abs(boosted.lbMin/r.lbMin-2)<1e-10);
 assert.ok(airflow({...air,chargeC:60}).lbMin<r.lbMin);
 assert.throws(()=>airflow({...air,inletLossPsi:20}));assert.throws(()=>airflow({...air,efficiency:0}));
 assert.throws(()=>airflow({...air,liters:1e308,rpm:1e308}));
});
test('PFI injector pressure scaling and diesel total-cycle fuel use distinct physical models',()=>{
 const r=fuelSizing({hp:400,bsfc:.6,count:4,duty:.8,ratedLbHr:75,ratedDeltaPsi:43.5,actualDeltaPsi:43.5,densityGcc:.745,rpm:6000,cylinders:4});
 assert.equal(r.requiredEachLbHr,75);assert.equal(r.supportedCrankHp,400);
 const high=fuelSizing({hp:400,bsfc:.6,count:4,duty:.8,ratedLbHr:75,ratedDeltaPsi:43.5,actualDeltaPsi:174,densityGcc:.745,rpm:6000,cylinders:4});assert.equal(high.availableEachLbHr,150);
 assert.ok(Math.abs(r.dieselMgCycle-151.1974567)<.001);assert.equal(wheelTrim(50,100),25);assert.throws(()=>wheelTrim(80,60));
});
test('scope data retains differential polarity, rejects blanks, nonmonotonic time and false zeroes',()=>{
 const r=parseCanVoltage('time_us,can_h_v,can_l_v\n0,2.5,2.5\n1,3.5,1.5');assert.equal(r[1].diff_v,2);assert.equal(r[1].common_v,2.5);
 for(const text of ['time_us,can_h_v,can_l_v\n0,,2.5\n1,3,2','time_us,can_h_v,can_l_v\n1,2,2\n1,3,2','time_us,can_h_v,can_l_v\n0,NaN,2\n1,3,2'])assert.throws(()=>parseCanVoltage(text));
});
test('CAN identifiers normalize and gaps refer only to capture time, with FD payloads accepted',()=>{
 const frames=parseCanFrames('time_ms,can_id,data_hex\n0,123,AB\n10,0x123,CD\n35,123,00');const rows=canInventory(frames);assert.equal(rows[0].id,'0x123');assert.equal(rows[0].maxGapMs,25);assert.equal(rows[0].count,3);
 assert.throws(()=>parseCanFrames('time_ms,can_id,data_hex\n0,20000000,00'));assert.throws(()=>parseCanFrames('time_ms,can_id,data_hex\n0,123,0'));
 assert.equal(parseCanFrames('time_ms,can_id,data_hex\n0,1FFFFFFF,'+'AB'.repeat(64))[0].data_hex.length,128);
 assert.throws(()=>parseCanFrames('time_ms,can_id,data_hex\n0,123,'+'AB'.repeat(9)));
});
