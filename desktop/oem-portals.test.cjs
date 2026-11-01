const {test}=require('node:test');
const assert=require('node:assert/strict');
const {resolvePortal}=require('./oem-portals.cjs');
test('external navigation accepts only named official OEM routes',()=>{
 assert.equal(new URL(resolvePortal('gm')).hostname,'www.acdelcotds.com');
 for(const id of ['file:///C:/Windows/system32/cmd.exe','https://example.com','__proto__','constructor',null,{}])assert.throws(()=>resolvePortal(id));
});
