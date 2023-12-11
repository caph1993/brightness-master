//@ts-check
const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const { state, ctlSet, xsfSet } = require('./main-backend');

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
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

  // mainWindow.on('show', () => {
  //   let opacity = 0;
  //   const increment = 0.2; // Adjust the increment to control the animation speed

  //   const interval = setInterval(() => {
  //     if (opacity >= 0.5) {
  //       clearInterval(interval);
  //       opacity = 0.5; // Ensure the final opacity is set accurately
  //     }
  //     mainWindow.webContents.send('set-opacity', opacity);
  //     opacity += increment;
  //   }, 50); // Adjust the interval to control the smoothness of the animation
  // });

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


  process.on('SIGUSR1', () => {
    // console.log(`Received signal!`, state.brightness.toFixed(3), ctlGet().toFixed(3));
    // state.brightness = ctlGet(); // Update local state
    mainWindow.show();
    mainWindow.webContents.send('front_focus');
    // const { args, time } = JSON.parse('' + readFileSync(queuePath));
    // console.log('signal delay', new Date().getTime() - time)
    // onCLI(args);
  });

  app.on('second-instance', (event, argv, cwd) => {
    const args = argv.slice(1);
    onCLI(args);
  });

  const onCLI = (args) => {
    // Send a message with arguments to the running instance
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    // mainWindow.webContents.send('front_command_line', { args });
  }

  mainWindow.webContents.on('did-frame-finish-load', () => {
    mainWindow.webContents.send('front_value', 'ctl', state.brightness);
    mainWindow.webContents.send('front_value', 'xsf', state.brightness2);
  //   mainWindow.webContents.openDevTools();
  });


  // Handle messages from the renderer process
  ipcMain.on('back_console', (event, ...args) => console.log(...args));

  ipcMain.on('back_hide', (event) => mainWindow.hide());

  ipcMain.on('back_update', (event, key, value, mode) => {
    const f = { ctl: ctlSet, xsf: xsfSet }[key];
    const newValue = f(value, mode);
    mainWindow.webContents.send('front_value', key, newValue);
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

