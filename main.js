const { app, BrowserWindow, dialog } = require('electron');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');

function createWindow() {
    const win = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.loadFile('index.html'); // Replace 'index.html' with your HTML file name
}

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// Check for updates and notify
app.on('ready', () => {
    createWindow();
    autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('update-available', (info) => {
    log.info('Update available.');
    dialog.showMessageBox({
        type: 'info',
        title: 'Update available',
        message: 'A new version is available. Downloading now...',
    });
});

autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded.');
    dialog.showMessageBox({
        type: 'info',
        title: 'Update ready',
        message: 'A new version is ready. Restart now to update?',
        buttons: ['Restart', 'Later']
    }).then((returnValue) => {
        if (returnValue.response === 0) autoUpdater.quitAndInstall();
    });
});

autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater. ' + err);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});