const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const native=require('./native-worker.cjs');
const companion=require('./companion.cjs');
test('native worker discovers, suspends for handoff and resumes',async()=>{
 native.configure({python:process.env.JH_TEST_PYTHON || (process.platform==='win32'?'python':'python3'),script:path.join(__dirname,'native-service/python/service.py')});
 native.resume();
 try {
  const result=await native.request('discover');assert.ok(Array.isArray(result.drivers));
  await assert.rejects(native.request('flash'),/Unknown native operation/);
  await native.stop();
  await assert.rejects(native.request('discover'),/suspended/);
  native.resume();
  const after=await native.request('discover');assert.ok(Array.isArray(after.drivers));
 } finally {await native.stop();}
});
test('companion rejects unsupported controller families',async()=>{
 for(const family of ['LLY','AL5','E90','P59;anything',undefined])await assert.rejects(companion.launch({family}),/only for confirmed P01\/P59/);
});
