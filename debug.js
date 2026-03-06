const { app, BrowserWindow } = require('electron');
app.whenReady().then(() => {
    const win = new BrowserWindow({ width: 600, height: 400 });
    win.loadURL('data:text/html,<html><body style="background:black;color:white;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><h1>DEBUG MODE: ELECTRON IS WORKING</h1></body></html>');
});
