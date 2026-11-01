const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const native = require('./native-worker.cjs');
const companion = require('./companion.cjs');
if (app.isPackaged) native.configure({ python:path.join(process.resourcesPath,'python-x86','python.exe'), script:path.join(process.resourcesPath,'native-service','service.py') });

const isDev = !app.isPackaged && !process.argv.includes('--jh-built');
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#0c0e10',
    title: 'JH Diesel Calibration Suite',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', event => event.preventDefault());
  if (isDev) {
    mainWindow.loadURL(process.env.JH_DESKTOP_RENDERER_URL || 'http://127.0.0.1:8080');
  } else {
    // Production packaging must include the local renderer output at this path.
    mainWindow.loadFile(path.join(app.getAppPath(), 'desktop-renderer', 'desktop.html'));
  }
}

ipcMain.handle('jh:runtime-info', () => ({
  platform: process.platform,
  arch: process.arch,
  packaged: app.isPackaged,
  version: app.getVersion(),
}));

ipcMain.handle('jh:native', async (event, op, args) => {
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame) throw new Error('Untrusted sender');
  if (companion.isActive()) throw new Error('Close PCM Hammer before using the JH adapter worker.');
  native.resume();
  return native.request(op, args);
});
ipcMain.handle('jh:launch-pcmhammer', async (event, family) => {
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame) throw new Error('Untrusted sender');
  return companion.launch({ family, resources:app.isPackaged ? process.resourcesPath : path.join(__dirname,'resources'), userData:app.getPath('userData'), stopNative:native.stop });
});
app.on('before-quit', () => { native.stop().catch(() => {}); });

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
