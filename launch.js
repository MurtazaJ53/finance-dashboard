if (process.env.ELECTRON_RUN_AS_NODE) {
    console.log('Clearing ELECTRON_RUN_AS_NODE: ' + process.env.ELECTRON_RUN_AS_NODE);
    delete process.env.ELECTRON_RUN_AS_NODE;
}
const { spawn } = require('child_process');
const electronPath = require('electron');

console.log('Spawning Electron from: ' + electronPath);
process.env.VITE_DEV_SERVER_URL = 'http://localhost:5173';
const child = spawn(electronPath, ['.'], {
    stdio: 'inherit',
    env: process.env
});

child.on('close', (code) => {
    process.exit(code);
});
