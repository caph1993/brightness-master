//@ts-check
const { app } = require('electron');
const { exit } = require('process');

const isFirstInstance = app.requestSingleInstanceLock();
if (!isFirstInstance) {
  // This should not occur because the main launcher will avoid new instances.
  // It's here just in case someone has the idea of launching main.js twice, and also
  // to remember that this method is very slow for a brightness app. 
  // electron will trigger automatically the 'second-instance' event to the main instance
  // the event contains the command line arguments automatically 
  app.quit();
  console.log('Triggered event to the unique instance.')
  exit(0);
} else {
  require('./main-window');
}
