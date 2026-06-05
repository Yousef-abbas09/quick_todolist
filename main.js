const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron')
const path = require('path')
const Datastore = require('nedb-promises')

// Database Setup (Pure JS NeDB)
const dbPath = path.join(app.getPath('userData'), 'tasks.db')
const db = Datastore.create(dbPath)

let win

function createWindow() {
  win = new BrowserWindow({
    width: 460,
    height: 520,
    frame: false,
    show: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })

  win.loadFile('index.html')
  
  win.on('blur', () => win.hide())
}

app.whenReady().then(() => {
  createWindow()

  globalShortcut.register('Ctrl+Space', () => {
    if (win.isVisible()) {
      win.hide()
    } else {
      win.show()
      win.focus()
    }
  })
})

app.on('window-all-closed', (e) => e.preventDefault())

// IPC Handlers for Database (NeDB)
ipcMain.handle('get-tasks', async () => {
  return await db.find({}).sort({ createdAt: -1 })
})

ipcMain.handle('add-task', async (event, { text, date, tag }) => {
  const doc = await db.insert({
    text,
    date,
    tag,
    done: 0,
    createdAt: Date.now()
  })
  return doc._id
})

ipcMain.handle('toggle-task', async (event, id) => {
  const task = await db.findOne({ _id: id })
  if (task) {
    await db.update({ _id: id }, { $set: { done: 1 - task.done } })
  }
})

ipcMain.handle('delete-task', async (event, id) => {
  await db.remove({ _id: id })
})

ipcMain.on('hide-window', () => win.hide())