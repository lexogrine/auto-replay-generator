/* eslint-disable no-console */
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { isConnected, startWebSocketServer } from './arg/server';
export const isDev = process.env.DEV === 'true';

const createMainWindow = async () => {
	let win: BrowserWindow | null;

	if (app) {
		app.on('window-all-closed', app.quit);

		app.on('before-quit', async () => {
			if (!win) return;

			win.removeAllListeners('close');
			win.close();
		});
	}

	win = new BrowserWindow({
		height: 435,
		show: false,
		frame: false,
		titleBarStyle: 'hidden',
		//resizable: isDev,
		title: 'Lexogrine Auto Replay Generator',
		icon: path.join(__dirname, 'assets/icon.png'),
		webPreferences: {
			backgroundThrottling: false,
			nodeIntegration: true
			//devTools: isDev
		},
		minWidth: 775,
		minHeight: 435,
		width: 775
	});

	const address = await startWebSocketServer(win);

	ipcMain.on('getAddress', ev => {
		ev.reply('address', address);
	});
	ipcMain.on('getStatus', ev => {
		ev.reply('status', isConnected);
	});

	ipcMain.on('min', () => {
		win.minimize();
	});

	ipcMain.on('max', () => {
		if (win.isMaximized()) {
			win.restore();
		} else {
			win.maximize();
		}
	});

	ipcMain.on('close', () => {
		win.close();
	});

	win.once('ready-to-show', () => {
		if (win) {
			win.show();
		}
	});
	// win.setMenu(null);
	win.setMenuBarVisibility(!isDev);

	win.loadURL(isDev ? 'http://localhost:3023' : `file://${__dirname}/build/index.html`);
	win.on('close', () => {
		win = null;
		app.quit();
	});
};

const lock = app.requestSingleInstanceLock();
if (!lock) {
	app.quit();
} else {
	app.on('ready', createMainWindow);
}
