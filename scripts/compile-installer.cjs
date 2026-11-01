const {getMakeNsisPath}=require('app-builder-lib/out/toolsets/windows');
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const {version}=require('../package.json');
 const compiler=await getMakeNsisPath();
 const output=path.join(root,'installable',`JH-Diesel-Setup-${version}.exe`);
 // Generate the removal list from this exact payload, independently of hook
 // resolution and the packager's staged-app project directory.
 await require('../desktop/after-pack.cjs')({
  appOutDir:path.join(root,'installable','win-unpacked'),
  packager:{projectDir:root},
 });
 const prefix=process.platform==='win32'?'/':'-';
 execFileSync(compiler.path,[`${prefix}DPROJECT_DIR=${root}`,`${prefix}DVERSION=${version}`,`${prefix}DPAYLOAD_DIR=${path.join(root,'installable','win-unpacked')}`,`${prefix}XOutFile "${output}"`,`${prefix}XSetCompressor zlib`,path.join(root,'desktop','installer.nsi')],{stdio:'inherit',env:{...process.env,...compiler.env}});
 const size=fs.statSync(output).size;
 if(size<50*1024*1024)throw Error('Installer unexpectedly small; payload verification required');
 console.log(`Installer compiled: ${output} (${size} bytes)`);
})().catch(e=>{console.error(e);process.exitCode=1;});
