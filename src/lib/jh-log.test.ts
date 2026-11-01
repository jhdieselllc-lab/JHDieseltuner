import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseLog} from './jh-log.ts';
test('numeric CSV preserves units, decimals and zero',()=>{const r=parseLog('\uFEFFtime_s,rpm,temp_C\r\n0,0,-2.5\r\n.1,800,3');assert.deepEqual(r.channels,['rpm','temp_C']);assert.equal(r.rows[0].temp_C,-2.5);assert.equal(r.rows[0].rpm,0);});
test('missing, infinite, nonnumeric and extra cells rejected',()=>{for(const row of ['0,','0,Infinity','0,NaN','0,text','0,1,2'])assert.throws(()=>parseLog('time_s,rpm\n'+row+'\n1,900'));});
test('duplicate channels, negative time and unordered time rejected',()=>{for(const csv of ['time_s,rpm,rpm\n0,1,2\n1,2,3','time_s,rpm\n-1,1\n1,2','time_s,rpm\n1,1\n1,2','time_s,rpm\n2,1\n1,2'])assert.throws(()=>parseLog(csv));});
test('large logs and unsafe names rejected',()=>{assert.throws(()=>parseLog('time_s,__proto__\n0,1\n1,2'));assert.throws(()=>parseLog('time_s,rpm\n'+Array.from({length:50001},(_,i)=>`${i},1`).join('\n')));});
