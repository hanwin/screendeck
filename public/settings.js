// Load current settings into the form
window.electronAPI.getSettings().then((settings) => {
    document.getElementById('companionIP').value =
        settings.companionIP || '127.0.0.1'
    document.getElementById('companionPort').value =
        settings.companionPort || 16622
    document.getElementById('keysTotal').value = settings.keysTotal || 6
    document.getElementById('keysPerRow').value = settings.keysPerRow || 1
	document.getElementById('bitmapSize').value = settings.bitmapSize || 72
    document.getElementById('alwaysOnTop').checked =
        settings.alwaysOnTop || false
    document.getElementById('movable').checked = settings.movable || false
    document.getElementById('enableHotKeys').checked =
        settings.enableHotKeys || false
})

// Handle form submission and save the updated settings
document.getElementById('settingsForm').addEventListener('submit', (event) => {
    event.preventDefault()

    const newSettings = {
        companionIP: document.getElementById('companionIP').value,
        companionPort: parseInt(
            document.getElementById('companionPort').value,
            10
        ),
        keysTotal: parseInt(document.getElementById('keysTotal').value, 10),
        keysPerRow: parseInt(document.getElementById('keysPerRow').value, 10),
		bitmapSize: parseInt(document.getElementById('bitmapSize').value, 10),
        alwaysOnTop: document.getElementById('alwaysOnTop').checked,
        movable: document.getElementById('movable').checked,
        enableHotKeys: document.getElementById('enableHotKeys').checked,
    }

    // Save the new settings using Electron API
    window.electronAPI.saveSettings(newSettings).then(() => {
        // Notify the main process to reload the window with new settings
        window.electronAPI.invoke('reloadWindow')
        // Close the settings window
        window.close()
    })
})
