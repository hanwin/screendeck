declare global {
    var satellite: Satellite | null
}

import ShortUniqueId from 'short-uuid'
import { Satellite } from './satellite'
import Store from 'electron-store'
import { defaultSettings } from './defaults'
import { showNotification } from './notification'

const store = new Store({ defaults: defaultSettings })

export function createSatellite(notificationShow: boolean = true) {
    const companionIP: string = store.get('companionIP', '127.0.0.1')
    const companionPort: number = store.get('companionPort', 16622)
    let deviceId: string = store.get('deviceId')

    if (!deviceId) {
        const uuidGenerator = ShortUniqueId()
        deviceId = uuidGenerator.new()
        store.set('deviceId', deviceId)
    }

    const keysTotal = store.get('keysTotal', 6)
    const keysPerRow = store.get('keysPerRow', 1)

    showNotification(
        'Connecting to Companion',
        `Connecting to Companion IP: ${companionIP}`
    )

    global.satellite = new Satellite(
        deviceId,
        'ScreenDeck',
        companionIP,
        companionPort,
        keysTotal,
        keysPerRow,
        72
    )

    global.satellite.on('connected', () => {
		if (notificationShow) {
			showNotification(
				'Satellite Connected',
				`Connected to Companion IP: ${companionIP}`
			)
		}
        global.mainWindow?.show() //show the window when satellite is connected
    })

    global.satellite.on('keyEvent', (keyEvent) => {
        if (global.mainWindow) {
            global.mainWindow.webContents.send('keyEvent', keyEvent)
        }
    })

    global.satellite.on('brightness', (brightness) => {
        if (global.mainWindow) {
            global.mainWindow.webContents.send('brightness', brightness)
        }
    })

    global.satellite.on('disconnected', () => {
        showNotification(
            'Satellite Disconnected',
            `Disconnected from Companion IP: ${companionIP}`
        )
        global.mainWindow?.hide() //hide the main window when satellite is disconnected
    })

    //on error
    global.satellite.on('error', (error) => {
        // Check the error code and send a user-friendly message to the renderer
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
            showNotification(
                'Connection Error',
                `Connection error: Unable to connect to ${error.address}:${error.port}. Please check the IP address and try again.`
            )
        } else {
            showNotification(
                'Connection Error',
                `An unexpected error occurred: ${error.message}`
            )
        }
    })

    global.satellite.connect()
}

export function closeSatellite() {
    global.satellite?.disconnect()
	global.satellite = null
}
