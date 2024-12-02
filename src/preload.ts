import { contextBridge, ipcRenderer } from 'electron'

// Expose APIs to the renderer process through contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
    // Wrapper for invoking IPC methods from the renderer
    invoke: (channel: string, data?: any) => ipcRenderer.invoke(channel, data),

    onBrightness: (callback: (event: any, brightness: number) => void) => {
        ipcRenderer.on('brightness', (event, brightness) =>
            callback(event, brightness)
        )
    },

    // Listener for key events (or other events)
    onKeyEvent: (callback: (event: any, keyObj: any) => void) => {
        ipcRenderer.on('keyEvent', (event, keyObj) => callback(event, keyObj))
    },

    // Fetch settings from the main process
    getSettings: () => ipcRenderer.invoke('getSettings'),

    // Save settings to the main process
    saveSettings: (newSettings: any) =>
        ipcRenderer.invoke('saveSettings', newSettings),
})
