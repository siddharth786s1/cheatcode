// Prevent GPU/DBus issues in headless environments
process.env.DBUS_SESSION_BUS_ADDRESS = 'unix:path=/dev/null';
process.env.CHROME_DEVEL_SANDBOX = '/tmp/chrome-devel-sandbox';
process.env.XDG_RUNTIME_DIR = '/tmp';
process.env.MEMORY_PRESSURE_THRESHOLD_MB = '4096';
process.env.ELECTRON_ENABLE_STACK_DUMPING = 'true';
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
process.env.XDG_CONFIG_HOME = '/tmp';
process.env.XDG_CACHE_HOME = '/tmp';
process.env.XDG_DATA_HOME = '/tmp';
process.env.QT_QPA_PLATFORM = 'offscreen';
process.env.XDG_SESSION_TYPE = 'x11';
process.env.XDG_SESSION_DESKTOP = 'x11';
process.env.XAUTHORITY = '/tmp/.Xauthority';
process.env.TMPDIR = '/tmp';
process.env['ELECTRON_RUN_AS_NODE'] = '1';
process.env['ELECTRON_FORCE_WINDOW_MENU_BAR'] = '1';
process.env['ELECTRON_DISABLE_GPU_SANDBOX'] = '1';
process.env['ELECTRON_OZONE_PLATFORM_HINT'] = 'x11';
process.env['ELECTRON_ENABLE_LOGGING'] = 'true';
process.env['ELECTRON_NO_ATTACH_CONSOLE'] = '1';
process.env['ELECTRON_DISABLE_SANDBOX'] = '1';
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
process.env['ELECTRON_DISABLE_GPU'] = '1';
process.env['ELECTRON_DISABLE_HARDWARE_ACCELERATION'] = '1';
process.env['ELECTRON_DISABLE_SOFTWARE_RASTERIZER'] = '1';
process.env['ELECTRON_DISABLE_VIZ_DISPLAY_COMPOSITOR'] = '1';
process.env['ELECTRON_DISABLE_DEV_SHM_USAGE'] = '0';
process.env['ELECTRON_CHROMIUM_SHM_DIR'] = '/dev/shm';

const { app, BrowserWindow, ipcMain, dialog } = require('electron');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');

const path = require('path');
require('dotenv').config();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false, // start hidden for stealth mode
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  // Show normally unless in stealth mode
  mainWindow.show();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Validate API key before instantiating OpenAI client
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  app.whenReady().then(() => {
    dialog.showErrorBox(
      'Configuration Error',
      'Missing OPENAI_API_KEY. Please add it to your .env file or set it as an environment variable.'
    );
    app.quit();
  });
}

const OpenAI = require('openai');
const openai = new OpenAI({ apiKey });

ipcMain.handle('toggle-stealth', (event, stealth) => {
  if (stealth) {
    mainWindow.hide();
  } else {
    mainWindow.show();
  }
});

ipcMain.handle('send-prompt', async (event, messages) => {
  // use the new chat.completions.create API
  const response = await openai.chat.completions.create({ model: 'gpt-4', messages });
  return response.choices[0].message;
});
