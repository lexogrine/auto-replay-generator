import net from 'net';
import { TelnetSocket } from 'telnet-stream';
export class NetConPort {
	socket: { telnet: TelnetSocket, native: net.Socket } | null;
	constructor() {
		this.socket = null;

		this.connectToTelnet();
	}

	execute = (command: string) => {
		if(!this.socket?.telnet) return;
	
		if (this.socket?.native.readyState === "open") {
			this.socket?.telnet.write(`${command}\n`)
		} else {
			console.log("COMMAND FAILED");
		}
	};

	private cleanUpAndReconnect = () => {
		console.log("Reconnection initiating");
		this.socket = null;
	}

	private connectToTelnet = () => {
		if(this.socket) return;

		try {
			const socket = net.createConnection(2121, "127.0.0.1");
			const telnetSocket = new TelnetSocket(socket);

			this.socket = { telnet: telnetSocket, native: socket };
			
			socket.on("error", () => {
				console.log("ERROR");
			});

			socket.on("close", () => {
				console.log("CLOSE");
				this.cleanUpAndReconnect();
			});

		} catch(e) {
			console.log("REDOING someting");
			setTimeout(this.connectToTelnet, 2000);
		}
	}

}
