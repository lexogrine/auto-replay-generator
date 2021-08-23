import { SimpleWebSocketServer } from 'simple-websockets-server';
import getPort from 'get-port';
import internalIp from 'internal-ip';
import { BrowserWindow } from 'electron/main';
import { ARGKillEntry, ARGQueue } from './queue';
import { ipcMain } from 'electron';


export let isConnected = false;

export const startWebSocketServer = async (win: BrowserWindow) => {
    const port = await getPort();
    const ip = internalIp.v4.sync();
    const server = new SimpleWebSocketServer({ port });

    const arg = new ARGQueue(server);

    ipcMain.on('switchToPlayer', (ev, name: string) => {
        arg.swapToPlayer(name);
    });

    server.onConnection(socket => {
        socket.on('register', () => {
            if (isConnected) {
                socket._socket.close();
                return;
            }
            isConnected = true;
            win.webContents.send('argStatus', true);
        });

        socket.on('kills', (kills: ARGKillEntry[]) => {
            arg.add(kills);
        });
        socket.on('disconnect', () => {
            isConnected = false;

            win.webContents.send('argStatus', false);
        })
    });


    return { ip, port };
}
