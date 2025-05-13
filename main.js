const { app, BrowserWindow, ipcMain, dialog } = require('electron');
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
