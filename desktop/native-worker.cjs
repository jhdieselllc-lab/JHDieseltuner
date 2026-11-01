const { spawn } = require('node:child_process');
const path = require('node:path');
const readline = require('node:readline');
let worker, nextId = 0;
let config = {};
let suspended = false;
function resume() { suspended = false; }
function configure(value) { config = value; }
const pending = new Map();
function failAll(error) { for (const item of pending.values()) { clearTimeout(item.timer); item.reject(error); } pending.clear(); }
function start() {
  if (worker) return;
  // Set an absolute path to matching x86/x64 Python in trusted launcher configuration.
  worker = spawn(config.python || process.env.JH_PYTHON || 'python', ['-I', '-u', config.script || path.join(__dirname, 'native-service/python/service.py')], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  const current = worker;
  current.on('error', e => { if (worker === current) { worker = undefined; failAll(e); } });
  current.on('exit', () => { if (worker === current) { worker = undefined; failAll(new Error('Native worker stopped')); } });
  current.stderr.on('data', () => {});
  readline.createInterface({ input: current.stdout }).on('line', line => {
    try { const msg = JSON.parse(line); const item = pending.get(msg.id); if (!item) return; pending.delete(msg.id); clearTimeout(item.timer); msg.ok ? item.resolve(msg.result) : item.reject(new Error(msg.error)); } catch { failAll(new Error('Invalid native worker response')); }
  });
}
function request(op, args = {}) {
  if (suspended) return Promise.reject(new Error('Native worker suspended for companion adapter handoff'));
  if (!['discover', 'connect', 'poll', 'disconnect'].includes(op)) return Promise.reject(new Error('Unknown native operation'));
  if (pending.size) return Promise.reject(new Error('Native worker busy'));
  if (op === 'connect' && (typeof args.driverId !== 'string' || typeof args.protocol !== 'string')) return Promise.reject(new Error('Invalid connection request'));
  start(); const id = ++nextId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { const old = worker; worker = undefined; failAll(new Error('Native operation timed out; session terminated')); old?.kill(); }, 10000);
    pending.set(id, { resolve, reject, timer });
    worker.stdin.write(JSON.stringify({ id, op, args }) + '\n', error => { if (error) { clearTimeout(timer); pending.delete(id); reject(error); } });
  });
}
async function stop() {
  suspended = true;
  const current = worker; worker = undefined; failAll(new Error('Native session closed'));
  if (current && current.exitCode === null) await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Native worker did not exit; adapter handoff cancelled')), 3000);
    current.once('exit', () => { clearTimeout(timer); resolve(); });
    current.once('error', () => { clearTimeout(timer); resolve(); });
    current.kill();
  });
}
let queue = Promise.resolve();
let queued = 0;
function serializedRequest(op, args) {
  if (queued >= 8) return Promise.reject(new Error('Native request queue full'));
  queued++;
  const job = queue.then(() => request(op, args));
  queue = job.catch(() => {}).finally(() => { queued--; });
  return job;
}
module.exports = { request: serializedRequest, stop, configure, resume };
