import {mkdir,rm,cp,readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
const app=new URL('build/desktop-app/',root);
await rm(app,{recursive:true,force:true});await mkdir(new URL('desktop/',app),{recursive:true});
for(const name of ['main.cjs','preload.cjs','native-worker.cjs','companion.cjs','oem-portals.cjs']) await cp(new URL('desktop/'+name,root),new URL('desktop/'+name,app));
await cp(new URL('desktop-renderer/',root),new URL('desktop-renderer/',app),{recursive:true});
await writeFile(new URL('package.json',app),JSON.stringify({name:manifest.name,version:manifest.version,main:manifest.main,productName:manifest.productName,description:manifest.description,author:manifest.author,license:'UNLICENSED'},null,2));
console.log('Desktop-only application staged (no web-server dependencies).');
