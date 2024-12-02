declare global {
    var satellite: Satellite | null
}

import ShortUniqueId from 'short-uuid'
import { KeyEvent, Satellite } from './satellite'
import Store from 'electron-store'
import { defaultSettings } from './defaults'
import { showNotification } from './notification'
import { updateTrayMenu } from './tray'

const store = new Store({ defaults: defaultSettings })

let keyQueue: KeyEvent[] = []

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
    const bitmapSize = store.get('bitmapSize', 72)

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
        bitmapSize
    )

    global.satellite.on('connected', () => {
        if (notificationShow) {
            showNotification(
                'Satellite Connected',
                `Connected to Companion IP: ${companionIP}`
            )
        }
        global.mainWindow?.show() //show the window when satellite is connected
		updateTrayMenu()
    })

    global.satellite.on('keyEvent', (keyEvent) => {
        addToKeyQueue(keyEvent)
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

function addToKeyQueue(keyObj: KeyEvent) {
    keyQueue.push(keyObj)
    //implement a queue so that we can process multiple key updates one at a time
    if (keyQueue.length === 1) {
        processKeyQueue()
    }
}

function processKeyQueue() {
    //console.log('Processing key queue. Length:', keyQueue.length)
    if (keyQueue.length > 0) {
        const keyObj: KeyEvent = keyQueue.shift() as KeyEvent
        processKey(keyObj)
    }
}

function processKey(keyObj: KeyEvent) {
    if (global.mainWindow) {
        global.mainWindow.webContents.send('keyEvent', keyObj)
    }

    //process the next key in the queue
    processKeyQueue()
}

export function closeSatellite() {
    global.satellite?.disconnect()
    global.satellite = null
}
