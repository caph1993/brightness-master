console.log('HERE')
const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const { exit } = require('process');


const isFirstInstance = app.requestSingleInstanceLock();
if (!isFirstInstance) {
  // electron will trigger automatically the 'second-instance' event to the main instance
  // the event contains the command line arguments automatically 
  app.quit();
  console.log('HERE')

  console.log('Triggered event to the unique instance.')
  exit(0);
}

let mainWindow;
let tray;

app.on('second-instance', (event, commandLine, workingDirectory) => {
  // Send a message with arguments to the running instance
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    console.log({commandLine, workingDirectory})
    mainWindow.webContents.send('command-line-args', commandLine.slice(1));
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
    },
    // show: false, // Set show to false to prevent the taskbar icon
    // skipTaskbar: true, // Set to true to prevent the taskbar icon
    icon: path.join(__dirname, 'tray-icon.png'),
  });

  mainWindow.loadFile('index.html');

  mainWindow.setAlwaysOnTop(true);

  // Log window position changes
  mainWindow.on('move', () => {
    const position = mainWindow.getPosition();
    console.log('Window position:', position);
  });

  mainWindow.on('blur', () => {
    // Hide the window when it loses focus
    mainWindow.hide();
  });

  mainWindow.on('show', () => {
    let opacity = 0;
    const increment = 0.2; // Adjust the increment to control the animation speed

    const interval = setInterval(() => {
      if (opacity >= 0.5) {
        clearInterval(interval);
        opacity = 0.5; // Ensure the final opacity is set accurately
      }
      mainWindow.webContents.send('set-opacity', opacity);
      opacity += increment;
    }, 50); // Adjust the interval to control the smoothness of the animation
  });

  // Create tray icon
  const iconPath = path.join(__dirname, 'tray-icon.png');
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow.show();
      },
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);
  tray.setToolTip('Electron Slider App');
  tray.setContextMenu(contextMenu);

  // Toggle window visibility when clicking tray icon
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  // Ensure tray is destroyed when the window is closed
  mainWindow.on('closed', () => {
    tray.destroy();
  });

  
  // Handle messages from the renderer process
  ipcMain.on('button1-clicked', () => {
    console.log('Button 1 clicked!');
    // Perform actions associated with Button 1 click
  });

  ipcMain.on('button2-clicked', () => {
    console.log('Button 2 clicked!');
    // Perform actions associated with Button 2 click
  });

  ipcMain.on('slider-value-changed', (event, value) => {
    console.log('Slider value changed:', value);
    // Perform actions associated with slider value change
  });

}


app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Ensure tray is properly destroyed when quitting the app
app.on('before-quit', () => {
  if (tray) {
    tray.destroy();
  }
});

