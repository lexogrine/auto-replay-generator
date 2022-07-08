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
		window.ipcApi.on('argStatus', (status: boolean) => {
			setStatus(status);
		});
		window.ipcApi.on('status', (status: boolean) => {
			setStatus(status);
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
					<p>
						Replayer ID: {address} (
						<span className={status ? 'online' : 'offline'}>{status ? 'online' : 'offline'}</span>)
					</p>
					{port ? (
						<>
							<p>Run this command in CS:GO:</p>
							<code>mirv_pgl url &quot;ws://localhost:{port}&quot;; mirv_pgl start;</code>
						</>
					) : null}
				</main>
			</div>
		</div>
	);
}

export default App;
