/**
 * Queue lifecycle after adding kill:
 * 
 * 1. We clear all scheduled observing
 * 2. Get kills to show
 * 3. Schedule observing
 */

import { SimpleWebSocketServer } from "simple-websockets-server";
import { MIRVPGL } from "./hlae";
import { Connection } from "node-vmix";

const vMix = new Connection("localhost");

const RADIUS_TIME = 1500;
const now = () => (new Date()).getTime();


export interface ARGKillEntry {
	killer: string,
	timestamp: number,
	round: number,
	killerHealth: number,
	newKills: number,
    name: string
}

export interface Swap {
    kill: ARGKillEntry,
    timeouts: NodeJS.Timeout[],
}

const isKillBetter = (killToCheck: ARGKillEntry, killToCompare: ARGKillEntry, allKills: ARGKillEntry[]) => {
    const killsOfPlayerOne = allKills.filter(kill => kill.killer === killToCheck.killer).length;
    const killsOfPlayerTwo = allKills.filter(kill => kill.killer === killToCompare.killer).length;

    if(killsOfPlayerOne > killsOfPlayerTwo){
        return true;
    } else if(killsOfPlayerTwo > killsOfPlayerOne){
        return false;
    }

    return allKills.indexOf(killToCheck) < allKills.indexOf(killToCompare);
}

const isKillWorthShowing = (kill: ARGKillEntry, allKills: ARGKillEntry[]) => {
    if(kill.killerHealth === 0) return false;

    const conflictingKills = allKills.filter(exampleKill => exampleKill !== kill && exampleKill.killer !== kill.killer && exampleKill.killerHealth > 0).filter(exampleKill => Math.abs(kill.timestamp - exampleKill.timestamp) <= RADIUS_TIME*2);
   
    if(!conflictingKills.length) return true;

    const conflictingAndBetterKills = conflictingKills.filter(conflicting => isKillBetter(kill, conflicting, allKills));

    if(!conflictingAndBetterKills.length) return true;

    const willConflictedNotBeShown = conflictingAndBetterKills.every(conflicting => !isKillWorthShowing(conflicting, allKills));
    
    if(willConflictedNotBeShown){
        return true;
    }
    return false;
}

export class ARGQueue {
    private kills: ARGKillEntry[];
    private swaps: Swap[];
    private pgl: MIRVPGL;

    constructor(server: SimpleWebSocketServer){
        this.kills = [];
        this.swaps = [];
        this.pgl = new MIRVPGL(server);
    }

    swapToPlayer = (name: string) => {
        this.pgl.execute(`spec_player_by_name ${name}`);
    }

    private generateSwap = (kill: ARGKillEntry, prev: ARGKillEntry | null, next: ARGKillEntry | null) => {
        const timeToKill = kill.timestamp - now();
        const timeToExecute = timeToKill - RADIUS_TIME;

        const timeToMarkIn = timeToKill - RADIUS_TIME/2;
        const timeToMarkOut = timeToKill + RADIUS_TIME/2;

        const timeout = setTimeout(() => {
            this.swapToPlayer(kill.name);
        }, timeToExecute);

        const timeouts = [ timeout ];

        if(!prev || Math.abs(prev.timestamp - kill.timestamp) > RADIUS_TIME*2){
            const markInTimeout = setTimeout(async () => {
                await vMix.send({ Function: 'ReplayLive' });
                await vMix.send({ Function: 'ReplayMarkIn' });
            }, timeToMarkIn);

            timeouts.push(markInTimeout);
        }

        if(!next || Math.abs(next.timestamp - kill.timestamp) > RADIUS_TIME*2){
            const markOutTimeout = setTimeout(async () => {
                await vMix.send({ Function: 'ReplayMarkOut' });
            }, timeToMarkOut);

            timeouts.push(markOutTimeout);
        }

        this.swaps.push({ kill, timeouts });
    }

    private regenerate = () => {
        this.swaps.forEach(swap => swap.timeouts.forEach(timeout => clearTimeout(timeout)));
        this.swaps = [];

        const interestingKills = this.kills.filter(kill => isKillWorthShowing(kill, this.kills)).sort((a, b) => a.timestamp - b.timestamp);

        interestingKills.forEach((kill, index, array) => this.generateSwap(kill, array[index-1] || null, array[index+1] || null));
    }

    add = (kills: ARGKillEntry[]) => {
        const allKills = [...this.kills, ...kills].filter(kill => kill.timestamp - 2000 >= now());
        this.kills = allKills;

        this.regenerate();
    }
}

