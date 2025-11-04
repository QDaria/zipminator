const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    title: 'Qdaria QRNG - Quantum Security Demo'
  });

  mainWindow.loadFile('src/index.html');

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  console.log('Starting Python backend...');

  // Use venv Python if it exists, otherwise fall back to system Python
  const venvPython = path.join(__dirname, '../backend/venv/bin/python3');
  const fs = require('fs');
  const pythonPath = fs.existsSync(venvPython) ? venvPython :
                     (process.platform === 'win32' ? 'python' : 'python3');

  const backendPath = path.join(__dirname, '../backend/server.py');
  console.log(`Using Python: ${pythonPath}`);

  backendProcess = spawn(pythonPath, [backendPath], {
    cwd: path.join(__dirname, '../backend'),
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

app.on('ready', () => {
  startBackend();
  // Wait for backend to start
  setTimeout(createWindow, 3000);
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
