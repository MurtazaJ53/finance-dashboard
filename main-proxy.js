console.log('--- PROXY LOADER ---');
// In some environments, the first require('electron') might return the path string.
// But we can try to bypass the local node_modules by using a relative path that doesn't exist 
// or by temporarily moving the local one.
// Actually, let's try to get it from the built-in modules list.

let electronAPI;
try {
    // Try to get it. If it returns a string, it's shadowed.
    const e = require('electron');
    if (typeof e === 'object' && e.app) {
        electronAPI = e;
    } else {
        console.log('Shadow detected in proxy. Attempting bypass...');
        // Bypass: delete from cache and try to require it with a trailing slash or something?
        // No, let's try to use the full path to the internal module if we could.
        // Actually, in Electron, we can try: 
        electronAPI = process.electronBinding ? require('electron') : null;
    }
} catch (err) {
    console.error('Bypass failed:', err);
}

if (!electronAPI || !electronAPI.app) {
    console.error('CRITICAL: Could not resolve Electron API!');
} else {
    console.log('SUCCESS: Electron API resolved in proxy.');
    global.realElectron = electronAPI;
}

require('./dist-electron/main.js');
