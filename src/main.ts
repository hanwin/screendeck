declare global {
    var mainWindow: BrowserWindow | null
}

import { app, BrowserWindow, globalShortcut } from 'electron'
import createTray from './tray'
import { createMainWindow } from './mainWindow' // Import the createMainWindow function
import { createSatellite } from './satelliteFunctions' // Import createSatellite and closeSatellite functions
import { showNotification } from './notification'
import { initializeIpcHandlers } from './ipcHandlers' // Import IPC handlers if needed

app.on('ready', () => {
    if (process.platform === 'darwin') {
        app.dock.hide()
    }

    createMainWindow()
    createTray()

    // Initialize IPC handlers after window creation
    initializeIpcHandlers()

    //wait 500ms before connecting to the satellite
    setTimeout(() => {
        createSatellite(true)
    }, 800)

    app.on('will-quit', () => {
        // Unregister all shortcuts when the app is about to quit
        globalShortcut.unregisterAll()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
    }
})
