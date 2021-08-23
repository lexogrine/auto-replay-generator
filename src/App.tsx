import { useState, useEffect } from 'react';
import './App.css';


const { ipcRenderer } = window.require('electron');


function App() {
	const [status, setStatus] = useState(false);
	const [address, setAddress] = useState('');

	const switchToOszten = () => {
		ipcRenderer.send('switchToPlayer', 'h-k')
	}

	useEffect(() => {
		setStatus(false);
		ipcRenderer.on('address', (e: any, address: { ip:string, port: number}) => {
			console.log('port',address.port)
			setAddress(address.ip.split('.').map(Number).map(n => n.toString(16)).join('-')+"-"+address.port.toString(16))
		});
		ipcRenderer.on('argStatus', (e: any, status: boolean) => {
			setStatus(status);
		});
		ipcRenderer.on('status', (e: any, status: boolean) => {
			setStatus(status);
		});
		ipcRenderer.send('getAddress');
		ipcRenderer.send('getStatus');
	}, [])


	const minimize = () => {
		ipcRenderer.send('min');
	};
	const maximize = () => {
		ipcRenderer.send('max');
	};
	const close = () => {
		ipcRenderer.send('close');
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
						LHM Status ({address}):{' '}
						<span className={status ? 'online' : 'offline'}>{status ? 'online' : 'offline'}</span>
					</p>
					<button onClick={switchToOszten}>SWITCH</button>
				</main>
			</div>
		</div>
	);
}

export default App;
