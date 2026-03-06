const { app, BrowserWindow } = require('electron');

app.whenReady().then(() => {
    console.log('SUCCESS: Electron app is ready');
    const win = new BrowserWindow({
        width: 800,
        height: 600
    });
    win.loadURL('about:blank');

    // Auto close after 5 seconds for test
    setTimeout(() => {
        console.log('Closing test window...');
        app.quit();
    }, 5000);
});
