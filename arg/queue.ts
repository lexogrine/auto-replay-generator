/**
 * Queue lifecycle after adding kill:
 *
 * 1. We clear all scheduled observing
 * 2. Get kills to show
 * 3. Schedule observing
 */

import { SimpleWebSocketServer } from 'simple-websockets-server';
import { MIRVPGL } from './hlae';
import { Connection } from 'node-vmix';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const configPath = path.join(app.getPath('userData'), 'config.json');

export const argConfig = {
	order: [
		{
			id: 'multikills',
			active: true
		},
		{
			id: 'headshots',
			active: true
		},
		{
			id: 'teamkill',
			active: false
		}
	],
	preTime: 1500,
	postTime: 1500,
	saveClips: false
};

let config = { vMixAddress: 'localhost' };

if (fs.existsSync(configPath)) {
	try {
		config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as { vMixAddress: string };
	} catch {}
} else {
	fs.writeFileSync(configPath, JSON.stringify(config), 'utf-8');
}

const vMix = new Connection(config?.vMixAddress || 'localhost');

const ENABLE_VMIX = true;

export interface ARGKillEntry {
	killer: string;
	timestamp: number;
	round: number;
	killerHealth: number;
	newKills: number;
	weapon?: string;
	victim?: string;
	name: string;
	teamkill: boolean;
	headshot: boolean;
}

export interface Swap {
	kill: ARGKillEntry;
	timeouts: NodeJS.Timeout[];
}

const comparisons: {
	[x: string]: (killToCheck: ARGKillEntry, killToCompare: ARGKillEntry, allKills: ARGKillEntry[]) => boolean | null;
} = {
	multikills: (killToCheck: ARGKillEntry, killToCompare: ARGKillEntry, allKills: ARGKillEntry[]) => {
		const killsOfPlayerOne = allKills.filter(kill => kill.killer === killToCheck.killer).length;
		const killsOfPlayerTwo = allKills.filter(kill => kill.killer === killToCompare.killer).length;

		if (killsOfPlayerOne > killsOfPlayerTwo) {
			return true;
		} else if (killsOfPlayerTwo > killsOfPlayerOne) {
			return false;
		}

		return null;
	},
	headshots: (killToCheck: ARGKillEntry, killToCompare: ARGKillEntry) => {
		if (killToCheck.headshot === killToCompare.headshot) return null;

		return killToCheck.headshot;
	},
	teamkill: (killToCheck: ARGKillEntry, killToCompare: ARGKillEntry) => {
		if (killToCheck.teamkill === killToCompare.teamkill) return null;

		return killToCheck.teamkill;
	}
};

const isKillBetter = (killToCheck: ARGKillEntry, killToCompare: ARGKillEntry, allKills: ARGKillEntry[]) => {
	const order = argConfig.order.filter(item => item.active).map(item => item.id);

	for (const orderType of order) {
		if (orderType in comparisons) {
			const result = comparisons[orderType](killToCheck, killToCompare, allKills);
			if (result === null) continue;
			return result;
		}
	}

	return allKills.indexOf(killToCheck) < allKills.indexOf(killToCompare);
};

const isKillWorthShowing = (kill: ARGKillEntry, allKills: ARGKillEntry[]) => {
	if (kill.killerHealth === 0) return false;

	const conflictingKills = allKills
		.filter(
			exampleKill => exampleKill !== kill && exampleKill.killer !== kill.killer && exampleKill.killerHealth > 0
		)
		.filter(
			exampleKill => Math.abs(kill.timestamp - exampleKill.timestamp) <= argConfig.preTime + argConfig.postTime
		);

	if (!conflictingKills.length) return true;

	const conflictingAndBetterKills = conflictingKills.filter(conflicting => isKillBetter(kill, conflicting, allKills));

	if (!conflictingAndBetterKills.length) return true;

	const willConflictedNotBeShown = conflictingAndBetterKills.every(
		conflicting => !isKillWorthShowing(conflicting, allKills)
	);

	if (willConflictedNotBeShown) {
		return true;
	}
	return false;
};

export class ARGQueue {
	private kills: ARGKillEntry[];
	private swaps: Swap[];
	private pgl: MIRVPGL;

	private isRecordingNow: boolean;
	private isPlayingNow: boolean;

	private playAfterRecording: boolean;

	constructor(server: SimpleWebSocketServer) {
		this.kills = [];
		this.swaps = [];
		this.pgl = new MIRVPGL(server);

		this.isPlayingNow = false;
		this.isRecordingNow = false;
		this.playAfterRecording = false;
	}

	swapToPlayer = (player: { steamid?: string; name?: string }) => {
		if (player.steamid) {
			this.pgl.execute(`spec_player_by_accountid ${player.steamid}`);
		} else if (player.name) {
			this.pgl.execute(`spec_player_by_name ${player.name}`);
		}
	};

	private generateSwap = (kill: ARGKillEntry, prev: ARGKillEntry | null, next: ARGKillEntry | null) => {
		const currentTime = Date.now();
		const timeToKill = kill.timestamp - currentTime;
		let timeToSwitch = 0;

		if (prev) {
			const timeToKillPrev = prev.timestamp - currentTime;

			timeToSwitch = (timeToKill + timeToKillPrev) / 2;
		}

		const timeout = setTimeout(() => {
			if (kill.weapon === 'hegrenade' && kill.victim) {
				this.swapToPlayer({ steamid: kill.victim });
			} else {
				this.swapToPlayer({ steamid: kill.killer });
			}
		}, timeToSwitch);

		const timeouts = [timeout];
		if (ENABLE_VMIX) {
			const timeToMarkIn = timeToKill - argConfig.preTime;
			const timeToMarkOut = timeToKill + argConfig.postTime;

			if (!prev || Math.abs(prev.timestamp - kill.timestamp) > argConfig.preTime + argConfig.postTime) {
				const markInTimeout = setTimeout(async () => {
					if (vMix.connected()) {
						this.isRecordingNow = true;
						await vMix.send({ Function: 'ReplayLive' });
						await vMix.send({ Function: 'ReplayMarkIn' });
					}
					//console.log(`START REPLAY FRAGMENT [${kill.name} -> ${kill.victim || 'SOMEONE'}]`,now());
				}, timeToMarkIn);

				timeouts.push(markInTimeout);
			}

			if (!next || Math.abs(next.timestamp - kill.timestamp) > argConfig.preTime + argConfig.postTime) {
				const markOutTimeout = setTimeout(async () => {
					if (vMix.connected()) await vMix.send({ Function: 'ReplayMarkOut' });

					//console.log(`END REPLAY FRAGMENT [${kill.name} -> ${kill.victim || 'SOMEONE'}]`,now());

					this.isRecordingNow = false;

					if (this.playAfterRecording) {
						this.show();
					}
				}, timeToMarkOut);

				timeouts.push(markOutTimeout);
			}
		}

		this.swaps.push({ kill, timeouts });
	};

	private regenerate = () => {
		if (this.isRecordingNow || this.isPlayingNow) return;

		this.swaps.forEach(swap => swap.timeouts.forEach(timeout => clearTimeout(timeout)));
		this.swaps = [];

		const interestingKills = this.kills
			.filter(kill => isKillWorthShowing(kill, this.kills))
			.sort((a, b) => a.timestamp - b.timestamp);

		interestingKills.forEach((kill, index, array) =>
			this.generateSwap(kill, array[index - 1] || null, array[index + 1] || null)
		);
	};

	clear = async () => {
		this.playAfterRecording = false;
		setTimeout(() => {
			if (vMix.connected()) vMix.send({ Function: 'ReplayStopEvents' });
			//console.log(`ReplayStopEvents`,now());
		}, 2000);
		if (vMix.connected()) {
			//console.log(`Moving / deleting events`,now());
			for (let i = 0; i < 10; i++) {
				if (argConfig.saveClips) {
					await vMix.send({ Function: 'ReplayMoveLastEvent', Value: '9' });
				} else {
					await vMix.send({ Function: 'ReplayDeleteLastEvent' });
				}
			}
		}
	};

	show = async () => {
		if (this.isRecordingNow) {
			this.playAfterRecording = true;
			return;
		}
		this.playAfterRecording = false;
		if (vMix.connected()) await vMix.send({ Function: 'ReplayPlayAllEventsToOutput' });
		//console.log(`Play all events to output`,now());
	};

	add = (kills: ARGKillEntry[]) => {
		const nowTime = Date.now();
		const allKills = [...this.kills, ...kills].filter(kill => kill.timestamp - 2000 >= nowTime);
		this.kills = allKills;

		this.regenerate();
	};
}
