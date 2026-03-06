console.log('--- ENV DISCOVERY ---');
try {
    const electron = process.mainModule.require('electron');
    console.log('Electron found via mainModule:', !!electron);
    console.log('App object:', electron.app ? 'Defined' : 'Undefined');
} catch (e) {
    console.log('Electron NOT found via mainModule');
    console.error(e);
}
process.exit(0);
