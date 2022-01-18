import WebSocket from 'ws';
import BufferReader from './BufferReader';
import { SimpleWebSocketServer } from 'simple-websockets-server';
import GameEventUnserializer from './GameEventUnserializer';

export class MIRVPGL {
	socket: WebSocket | null;
	constructor(server: SimpleWebSocketServer) {
		this.socket = null;

		this.init(server);
	}

	execute = (config: string) => {
		if (!this.socket) return;
		this.socket.send(new Uint8Array(Buffer.from(`exec\0${config}\0`, 'utf8')), { binary: true });
	};

	private init = async (server: SimpleWebSocketServer) => {
		const enrichments = {
			player_death: ['userid', 'attacker', 'assister']
		};

		server.onConnection(simpleSocket => {
			const newSocket = simpleSocket._socket as WebSocket;

			const socket = newSocket;

			if (!socket) return;

			const gameEventUnserializer = new GameEventUnserializer(enrichments);

			socket.on('message', data => {
				if (!(data instanceof Buffer)) {
					return;
				}
				if (this.socket !== socket) {
					if (this.socket) this.socket.close();
					this.socket = socket;
				}
				const bufferReader = new BufferReader(Buffer.from(data));
				try {
					while (!bufferReader.eof()) {
						const cmd = bufferReader.readCString();
						if (cmd !== 'hello' && cmd !== 'gameEvent') {
							return;
						}
						if (cmd === 'hello') {
							const version = bufferReader.readUInt32LE();
							if (2 != version) throw 'Error: version mismatch';
							socket.send(new Uint8Array(Buffer.from('transBegin\0', 'utf8')), { binary: true });
							socket.send(
								new Uint8Array(Buffer.from('exec\0mirv_pgl events enrich clientTime 1\0', 'utf8')),
								{ binary: true }
							);
							socket.send(
								new Uint8Array(
									Buffer.from(
										'exec\0mirv_pgl events enrich eventProperty "useridWithSteamId" "player_death" "userid"\0',
										'utf8'
									)
								),
								{ binary: true }
							);
							socket.send(
								new Uint8Array(
									Buffer.from(
										'exec\0mirv_pgl events enrich eventProperty "useridWithSteamId" "player_death" "attacker"\0',
										'utf8'
									)
								),
								{ binary: true }
							);
							socket.send(
								new Uint8Array(
									Buffer.from(
										'exec\0mirv_pgl events enrich eventProperty "useridWithSteamId" "player_death" "assister"\0',
										'utf8'
									)
								),
								{ binary: true }
							);
							socket.send(new Uint8Array(Buffer.from('exec\0mirv_pgl events enabled 1\0', 'utf8')), {
								binary: true
							});
							socket.send(new Uint8Array(Buffer.from('transEnd\0', 'utf8')), { binary: true });
							return;
						}
						gameEventUnserializer.unserialize(bufferReader);
					}
				} catch (err) {}
			});
		});
	};
}
