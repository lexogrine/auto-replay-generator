import { BrowserWindow } from 'electron';
import net from 'net';
import { TelnetSocket } from 'telnet-stream';
import { isConnected } from '../server';
export class NetConPort {
	socket: { telnet: TelnetSocket; native: net.Socket } | null;
	win: BrowserWindow;
	constructor(win: BrowserWindow) {
		this.socket = null;
		this.win = win;
		this.connectToTelnet();
	}

	execute = (command: string) => {
		if (!this.socket?.telnet) return;

		if (this.socket?.native.readyState === 'open') {
			this.socket?.telnet.write(`${command}\n`);
		} else {
			console.log('COMMAND FAILED');
		}
	};

	private cleanUpAndReconnect = () => {
		this.socket?.native.removeAllListeners();
		this.socket = null;
		setTimeout(this.connectToTelnet, 2000);
	};

	private connectToTelnet = () => {
		if (this.socket) return;

		try {
			const socket = net.createConnection(2121, '127.0.0.1');
			const telnetSocket = new TelnetSocket(socket);

			this.socket = { telnet: telnetSocket, native: socket };

			socket.on('connect', () => {
				this.win.webContents.send('status', isConnected, this.socket?.native.readyState === 'open');
			});

			socket.on('error', () => {
				//console.log('ERROR');
			});

			socket.on('close', () => {
				this.win.webContents.send('status', isConnected, this.socket?.native.readyState === 'open');
				this.cleanUpAndReconnect();
			});
		} catch (e) {
			//console.log('REDOING someting');
			setTimeout(this.connectToTelnet, 2000);
		}
	};
}
