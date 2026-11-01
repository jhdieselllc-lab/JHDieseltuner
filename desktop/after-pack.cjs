const fs=require('node:fs/promises');
const path=require('node:path');
module.exports=async context=>{
 const files=[],dirs=[];
 async function visit(dir,relative=''){
  for(const entry of await fs.readdir(dir,{withFileTypes:true})){
   const rel=path.posix.join(relative,entry.name);
   if(entry.isDirectory()){dirs.push(rel);await visit(path.join(dir,entry.name),rel);}
   else files.push(rel);
  }
 }
 await visit(context.appOutDir);
 const nsisPath=value=>value.replaceAll('$','$$').replaceAll('"','$\\"').replaceAll('/','\\');
 const lines=['!macro RemoveInstalledFiles',...files.map(f=>`Delete "$INSTDIR\\${nsisPath(f)}"`),...dirs.sort((a,b)=>b.split('/').length-a.split('/').length).map(d=>`RMDir "$INSTDIR\\${nsisPath(d)}"`),'!macroend'];
 await fs.writeFile(path.join(context.packager.projectDir,'desktop','installer-files.nsh'),lines.join('\n'));
};
