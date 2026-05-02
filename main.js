const fs = require('fs');
const { app, BrowserWindow, nativeImage } = require('electron');
const path = require('path');

function applyDockIcon() {
  if (process.platform !== 'darwin' || !app.dock) return;

  const iconPath = path.join(__dirname, 'assets', 'app-icon.png');
  if (!fs.existsSync(iconPath)) return;

  const icon = nativeImage.createFromPath(iconPath);
  if (!icon.isEmpty()) app.dock.setIcon(icon);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 680,
    resizable: true,
    title: 'Cycle Calendar',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  applyDockIcon();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
