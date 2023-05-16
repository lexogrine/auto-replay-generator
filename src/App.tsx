import { useState, useEffect } from 'react';
import './App.css';

declare global {
	interface Window {
		ipcApi: {
			send: (channel: string, ...arg: any) => void;
			on: (channel: string, func: (...arg: any) => void) => void;
		};
	}
}

function App() {
	const [status, setStatus] = useState(false);
	const [address, setAddress] = useState('');
	const [gameStatus, setGameStatus] = useState(false);
	const [port, setPort] = useState(0);

	useEffect(() => {
		setStatus(false);
		window.ipcApi.on('address', (address: { ip: string; port: number }) => {
			setPort(address.port);
			setAddress(
				address.ip
					.split('.')
					.map(Number)
					.map(n => n.toString(16))
					.join('-') +
					'-' +
					address.port.toString(16)
			);
		});
		window.ipcApi.on('status', (status: boolean, gameStatus: boolean) => {
			setStatus(status);
			setGameStatus(gameStatus);
		});
		window.ipcApi.send('getAddress');
		window.ipcApi.send('getStatus');
	}, []);

	const minimize = () => {
		window.ipcApi.send('min');
	};
	const maximize = () => {
		window.ipcApi.send('max');
	};
	const close = () => {
		window.ipcApi.send('close');
	};

	return (
		<div className="App">
			<div className="window-bar">
				<div className="window-drag-bar">
					<div className="title-bar">Lexogrine Auto Replay Generator</div>
				</div>
				<div onClick={minimize} className="app-control minimize"></div>
				<div onClick={maximize} className="app-control maximize"></div>
				<div onClick={close} className="app-control close"></div>
			</div>
			<div className="App-container">
				<main>
					<p>Lexogrine Auto Replay Generator</p>
					<p>Replayer ID: {address}</p>
					<p>
						LHM: <span className={status ? 'online' : 'offline'}>{status ? 'ONLINE' : 'OFFLINE'}</span>{' '}
					</p>
					{port ? (
						<>
							<p>
								Run CS:GO or Dota 2 with <code>-netconport 2121</code> launch parameter
							</p>
						</>
					) : null}
				</main>
			</div>
		</div>
	);
}

export default App;
