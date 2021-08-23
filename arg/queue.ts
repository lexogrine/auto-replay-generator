/**
 * Queue lifecycle after adding kill:
 * 
 * 1. We clear all scheduled observing
 * 2. Get kills to show
 * 3. Schedule observing
 */

import { SimpleWebSocketServer } from "simple-websockets-server";
import { MIRVPGL } from "./hlae";

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
    timeout: NodeJS.Timeout,
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

    generateSwap = (kill: ARGKillEntry) => {
        const timeToExecute = kill.timestamp - RADIUS_TIME - now();
        const timeout = setTimeout(() => {
            this.swapToPlayer(kill.name);
        }, timeToExecute);

        this.swaps.push({ kill, timeout });
    }

    regenerate = () => {
        this.swaps.forEach(swap => clearTimeout(swap.timeout));
        this.swaps = [];

        const interestingKills = this.kills.filter(kill => isKillWorthShowing(kill, this.kills));

        interestingKills.forEach(this.generateSwap);
    }

    add = (kill: ARGKillEntry) => {
        const kills = [...this.kills, kill].filter(kill => kill.timestamp - 2000 >= now());
        this.kills = kills;

        this.regenerate();
    }
}
// const arg = new ARGQueue();
