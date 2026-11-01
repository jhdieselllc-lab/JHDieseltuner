const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFile, spawn } = require('node:child_process');
const { promisify } = require('node:util');
const execFileAsync = promisify(execFile);
const EXPECTED_SHA256 = 'b4b24fdede9e61877273c3f020d881589ac05987524006b23d3ff081670beb04';
let active = false;
async function launch({ family, resources, userData, stopNative }) {
  if (!['P01','P59'].includes(family)) throw new Error('This companion route is enabled only for confirmed P01/P59 gasoline PCMs. LLY, Allison and other controllers are not enabled.');
  if (process.platform !== 'win32') throw new Error('PCM Hammer requires Windows.');
  if (active) throw new Error('PCM Hammer is already open or starting. Close it before opening another session.');
  active = true;
  try {
    await stopNative();
    const archive = path.join(resources,'companions','PCMHammer_2.0.0_Portable.zip');
    if (crypto.createHash('sha256').update(await fs.promises.readFile(archive)).digest('hex') !== EXPECTED_SHA256) throw new Error('Companion archive checksum mismatch. Reinstall from the original installer.');
    const destination = path.join(userData,'companions','PCM-Hammer-2.0.0');
    // Extract the complete unmodified official release on every launch so all files remain coherent.
    const powershell = path.join(process.env.SystemRoot || 'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
    await execFileAsync(powershell, ['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(resources,'companions','extract.ps1'),'-Archive',archive,'-Destination',destination], { windowsHide:true, timeout:60000 });
    const executable = path.join(destination,'PCMHammer','PcmHammer','PcmHammer.exe');
    await fs.promises.access(executable);
    const child = spawn(executable, [], {cwd:path.dirname(executable),windowsHide:false,stdio:'ignore'});
    await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});
    child.once('exit',()=>{active=false;});
    return { launched:true, message:'PCM Hammer opened separately. Select its adapter and read controller properties before selecting a supported operation. JH does not initiate or report flash success.' };
  } catch (e) {active=false;throw e;}
}
module.exports = {launch,isActive:()=>active};
