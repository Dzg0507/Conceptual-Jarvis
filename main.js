const { app, BrowserWindow, ipcMain, desktopCapturer, globalShortcut } = require('electron');
const path = require('path');
const { getAIResponse } = require('./src/ai.js');
const automation = require('./src/automation.js');

let mainWindow; // Make mainWindow accessible in the module scope

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 300,
    height: 80,
    x: 100,
    y: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Window starts as interactive by default. No passthrough logic here anymore.
}

function createOverlayWindow(bounds) {
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;

  const overlayWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width,
    height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload_overlay.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  overlayWindow.loadFile('overlay.html');
  overlayWindow.setIgnoreMouseEvents(true); // Overlay is always click-through

  overlayWindow.webContents.on('did-finish-load', () => {
    overlayWindow.webContents.send('draw-highlight', bounds);
  });

  setTimeout(() => {
    if (!overlayWindow.isDestroyed()) {
      overlayWindow.close();
    }
  }, 4000);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // --- Global Hotkey for Passthrough Toggle ---
  let isPassthrough = false; // Initial state is interactive
  const ret = globalShortcut.register('Alt+Shift+P', () => {
    isPassthrough = !isPassthrough;
    if (mainWindow) {
      mainWindow.setIgnoreMouseEvents(isPassthrough, { forward: true });
      const mode = isPassthrough ? 'PASSTHROUGH' : 'INTERACTIVE';
      console.log(`Passthrough mode toggled via hotkey: ${mode}`);
    }
  });

  if (!ret) {
    console.log('Failed to register global shortcut Alt+Shift+P');
  }

  ipcMain.handle('capture-screen', async (event, prompt) => {
    try {
      const sources = await desktopCapturer.getSources({ types: ['screen'] });
      const primarySource = sources[0];
      const pngBuffer = primarySource.thumbnail.toPNG();
      const imageBase64 = pngBuffer.toString('base64');

      const jsonPrompt = `
        You are a helpful desktop AI assistant. Analyze the user's request and the provided screenshot.
        The user's request is: "${prompt}"

        Determine the user's intent and the target UI element. Decide on ONE of the following actions: "click", "type", "highlight".

        - If the user wants to click something, find the element's bounding box, calculate the center point, and respond with a "click" action.
        - If the user wants to type something, respond with a "type" action and the text to type.
        - If the user is asking "where" something is or wants something identified, find the element's bounding box and respond with a "highlight" action.

        Respond with ONLY a single JSON object. Do not include any other text or markdown.
        The JSON object format depends on the action:
        - For "click": {"action": "click", "point": {"x": number, "y": number}}
        - For "type": {"action": "type", "text": "text to type"}
        - For "highlight": {"action": "highlight", "bounds": {"x": number, "y": number, "width": number, "height": number}}

        If you cannot fulfill the request, respond with {"action": "error", "message": "your error message"}.
      `;

      console.log('Sending prompt and screenshot to AI...');
      const aiResponse = await getAIResponse(jsonPrompt, imageBase64);
      console.log('Received AI response:', aiResponse);

      try {
        const jsonResponse = JSON.parse(aiResponse);
        switch (jsonResponse.action) {
          case 'click':
            console.log(`ACTION_LOG: Intending to CLICK at point: { x: ${jsonResponse.point.x}, y: ${jsonResponse.point.y} }`);
            // await automation.clickAt(jsonResponse.point); // This is commented out for safety
            return `Okay, I will click at { x: ${jsonResponse.point.x}, y: ${jsonResponse.point.y} }.`;

          case 'type':
            console.log(`ACTION_LOG: Intending to TYPE: "${jsonResponse.text}"`);
            // await automation.typeText(jsonResponse.text); // This is commented out for safety
            return `Okay, I will type "${jsonResponse.text}".`;

          case 'highlight':
            if (jsonResponse.bounds) {
              createOverlayWindow(jsonResponse.bounds);
              return 'Highlighting the element for you.';
            }
            return 'Could not find the element to highlight.';

          case 'error':
            return `Sorry, I encountered an error: ${jsonResponse.message}`;

          default:
            return "Sorry, I received an unknown action from the AI.";
        }
      } catch (e) {
        console.error('Failed to parse or execute AI response:', e);
        return aiResponse; // Return the raw text if JSON parsing fails
      }
    } catch (error) {
      console.error('An error occurred in the capture-screen handler:', error);
      throw error; // Propagate error back to the renderer
    }
  });

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Unregister all shortcuts when the application is about to quit.
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
