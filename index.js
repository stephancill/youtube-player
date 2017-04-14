'use strict';
const electron = require('electron')
const {app, BrowserWindow, globalShortcut, Menu} = require('electron')

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// prevent window being garbage collected
let mainWindow;

Menu.setApplicationMenu(Menu.buildFromTemplate([
	{
		label: 'Show', click: function() {
			mainWindow.show();
		}
	},
	{
		label: 'Quit', click:  function() {
			app.isQuiting = true;
			app.quit();
		}
	}
]))
function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	const win = new BrowserWindow({
		width: 1200,
		height: 800
	});

	win.loadURL(`https://youtube.com`);

	win.on('closed', onClosed);

	//Hide window
	win.on('minimize',function(event){
		if (process.platform !== "linux") {
			event.preventDefault()
			mainWindow.hide();
		}
    });

  	win.on('close', function (event) {
        if(!app.isQuiting){
			if (process.platform !== "linux") {
				event.preventDefault()
				mainWindow.hide();
			}
        }
        return false;
    });

	// Open the DevTools.
 	win.webContents.openDevTools()

	win.isResizable(true);

	return win;
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('ready', () => {
	mainWindow = createMainWindow();

	// Create global listeners
	var globalAccellerators = {
		"Shift+VolumeDown" 		: handleVolumeDown,
		"Shift+VolumeUp"		: handleVolumeUp,
		"Shift+VolumeMute"		: handleVolumeMute,
		"Shift+MediaPlayPause"	: handlePlayPause
	}

	for (var acc in globalAccellerators) {
		if (globalAccellerators.hasOwnProperty(acc)) {
			console.log(acc);
			const ret = globalShortcut.register(acc, globalAccellerators[acc])
			if (!ret) {
				console.log('registration failed')
			}
			// Check whether a shortcut is registered.
			console.log(globalShortcut.isRegistered(acc))
		}
	}



	// Set ad skipper
	mainWindow.webContents.on('did-finish-load', ()=>{
		console.log("loaded");
		let code = `
		// https://github.com/squgeim/yt-ad-autoskipper/
		;(function() {
		  var timeout = setInterval(function() {
			if (window.location.pathname !== '/watch') {
		      return;
		    }
		    var skipButton = document.querySelector('button.videoAdUiSkipButton');
		    if (skipButton) {
		      eventFire(skipButton, 'click');
		    }
		  }, 2000);

		  /**
		   * Got this function from:
		   * http://stackoverflow.com/questions/2705583/how-to-simulate-a-click-with-javascript
		   */
		  function eventFire(el, etype){
		    if (el.fireEvent) {
		      el.fireEvent('on' + etype);
		    } else {
		      var evObj = document.createEvent('Events');
		      evObj.initEvent(etype, true, false);
		      el.dispatchEvent(evObj);
		    }
		  }

		})();
		`
	    mainWindow.webContents.executeJavaScript(code);
	});
});

function handlePlayPause() {
	console.log("Pause/play");
	mainWindow.webContents.sendInputEvent({
		type: "keyDown",
		keyCode: 'k'
	});
}

// Volume controls
function handleVolumeUp() {
	console.log("Volume up");
	var code = `
		document.getElementsByClassName("video-stream")[0].volume += 0.1;
	`
	mainWindow.webContents.executeJavaScript(code)
}

function handleVolumeDown() {
	console.log("Volume down");
	var code = `
		document.getElementsByClassName("video-stream")[0].volume -= 0.1;
	`
	mainWindow.webContents.executeJavaScript(code)
}

function handleVolumeMute() {
	console.log("Volume mute");
	var code = `
		document.getElementsByClassName("video-stream")[0].volume = 0;
	`
	mainWindow.webContents.executeJavaScript(code)
}
