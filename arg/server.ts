import { SimpleWebSocketServer } from 'simple-websockets-server';
import getPort from 'get-port';
import internalIp from 'internal-ip';
import { BrowserWindow } from 'electron/main';
import { ARGKillEntry, ARGQueue, argConfig } from './queue';
import { ipcMain } from 'electron';

export interface Item {
	id: string;
	text: string;
	active: boolean;
}

export let isConnected = false;
let socketId = null;

export const startWebSocketServer = async (win: BrowserWindow) => {
	const port = await getPort({ port: [1300, 1302, 1304, 1305, 1310] });
	const ip = internalIp.v4.sync();
	const server = new SimpleWebSocketServer({ port });

	const arg = new ARGQueue(server);

	ipcMain.on('switchToPlayer', (ev, name: string) => {
		arg.swapToPlayer({ name });
	});

	server.onConnection(socket => {
		socket.on('register', (order: Item[], saveClips: boolean, safeBand: { preTime: number; postTime: number }) => {
			if (isConnected) {
				socket._socket.close();
				return;
			}
			if (order && Array.isArray(order)) {
				argConfig.order = order;
			}
			argConfig.saveClips = !!saveClips;
			argConfig.preTime = safeBand.preTime;
			argConfig.postTime = safeBand.postTime;
			socketId = socket;
			isConnected = true;
			win.webContents.send('argStatus', true);
			socket.send('registered');
		});

		socket.on('kills', (kills: ARGKillEntry[]) => {
			arg.add(kills);
		});

		socket.on('config', (order: Item[], saveClips: boolean, safeBand: { preTime: number; postTime: number }) => {
			argConfig.order = order;
			argConfig.saveClips = saveClips;
			argConfig.preTime = safeBand.preTime;
			argConfig.postTime = safeBand.postTime;
		});

		socket.on('saveClips', (saveClips: boolean) => {
			argConfig.saveClips = saveClips;
		});

		socket.on('clearReplay', arg.clear);

		socket.on('showReplay', arg.show);

		socket.on('disconnect', () => {
			if (socketId === socket) {
				isConnected = false;

				win.webContents.send('argStatus', false);
			}
		});
	});

	return { ip, port };
};
