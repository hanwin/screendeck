import { app, BrowserWindow, screen, globalShortcut } from 'electron'
import * as path from 'path'
import Store from 'electron-store'
import { defaultSettings } from './defaults'
import createTray, { updateTrayMenu } from './tray' // Ensure tray management works properly with window events

const store = new Store({ defaults: defaultSettings })

declare global {
    //var mainWindow: BrowserWindow | null
}

export function createMainWindow() {
    const alwaysOnTop = store.get('alwaysOnTop', true)
    const keysTotal = store.get('keysTotal', 6)
    const keysPerRow = store.get('keysPerRow', 1)
    const movable = store.get('movable', false)
    const enableHotKeys = store.get('enableHotKeys', false)

    const { width, height } = calculateWindowSize(keysTotal, keysPerRow)
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth } = primaryDisplay.workAreaSize

	if (global.mainWindow) {
		global.mainWindow.close()
		global.mainWindow = null
	}

		global.mainWindow = new BrowserWindow({
			width: width,
			height: height,
			x: screenWidth - width - 20,
			y: 20,
			transparent: true,
			frame: false,
			alwaysOnTop: alwaysOnTop,
			resizable: false,
			skipTaskbar: true,
			movable: movable,
			webPreferences: {
				preload: path.join(__dirname, 'preload.js'),
				contextIsolation: true, // Enable context isolation for security
				nodeIntegration: false, // Disable nodeIntegration for security
			},
		})
	
		global.mainWindow.loadFile(path.join(__dirname, '../public/index.html'))
		global.mainWindow.setHasShadow(false)

    // Register global shortcuts for each keypad button
    // Check settings and register global hotkeys if enabled
    if (enableHotKeys) {
        globalShortcut.unregisterAll() // Unregister all global shortcuts
        registerGlobalHotkeys(keysTotal) // Pass the total number of keys
    }1

    //hide the window until satellite is connected
    global.mainWindow?.hide()

    if (global.satellite?.isConnected) {
        global.mainWindow?.show()
    }

    global.mainWindow.on('blur', () => {
        if (!alwaysOnTop) {
            global.mainWindow?.hide()
        }
    })

    global.mainWindow.on('close', (event) => {
        event.preventDefault()
        global.mainWindow?.hide()
        updateTrayMenu() // Update tray menu when the window is closed
    })
}

function calculateWindowSize(keysTotal: number, keysPerRow: number) {
    const KEY_WIDTH = 72
    const KEY_HEIGHT = 72
    const PADDING = 20
    const GAP = 10
    const rows = Math.ceil(keysTotal / keysPerRow)
    const width = keysPerRow * KEY_WIDTH + (keysPerRow - 1) * GAP + PADDING * 2
    const height = rows * KEY_HEIGHT + (rows - 1) * GAP + PADDING * 2
    return { width, height }
}

function registerGlobalHotkeys(keysTotal: number) {
    // Define key combinations based on button index
    const hotkeys = []

    // Map 1-9 to Ctrl+Shift+Alt+1 through 9
    for (let i = 1; i <= Math.min(keysTotal, 9); i++) {
        hotkeys.push({ key: `CommandOrControl+Shift+Alt+${i}`, buttonIndex: i })
    }

    // Map 10 and above to Ctrl+Shift+Alt+A, B, C, etc.
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (let i = 10; i <= keysTotal && i - 10 < alphabet.length; i++) {
        const letter = alphabet[i - 10]
        hotkeys.push({
            key: `CommandOrControl+Shift+Alt+${letter}`,
            buttonIndex: i,
        })
    }

    hotkeys.forEach(({ key, buttonIndex }) => {
        const registered = globalShortcut.register(key, () => {
            // Send an event to the renderer to simulate a button press
            if (global.mainWindow) {
                global.mainWindow.webContents.send('globalHotkeyPress', buttonIndex)
            }
        })

        if (!registered) {
            console.error(`Failed to register global shortcut for ${key}`)
        }
    })
}
