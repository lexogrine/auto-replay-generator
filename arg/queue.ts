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
const ENABLE_VMIX = true;
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

    swapToPlayer = (player: { steamid?: string, name?: string }) => {
        console.log('swapping to', player)
        if(player.steamid){
            this.pgl.execute(`spec_player_by_accountid ${player.steamid}`);
        } else if(player.name){
            this.pgl.execute(`spec_player_by_name ${player.name}`);
        }
    }

    private generateSwap = (kill: ARGKillEntry, prev: ARGKillEntry | null, next: ARGKillEntry | null) => {
        const timeToKill = kill.timestamp - now();
        const timeToExecute = timeToKill - RADIUS_TIME;

        const timeout = setTimeout(() => {
            this.swapToPlayer({ steamid: kill.killer });
        }, timeToExecute);

        const timeouts = [ timeout ];
        if(ENABLE_VMIX){
            const timeToMarkIn = timeToKill - RADIUS_TIME;
            const timeToMarkOut = timeToKill + RADIUS_TIME;

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
        }

        this.swaps.push({ kill, timeouts });
    }

    private regenerate = () => {
        this.swaps.forEach(swap => swap.timeouts.forEach(timeout => clearTimeout(timeout)));
        this.swaps = [];

        const interestingKills = this.kills.filter(kill => isKillWorthShowing(kill, this.kills)).sort((a, b) => a.timestamp - b.timestamp);

        interestingKills.forEach((kill, index, array) => this.generateSwap(kill, array[index-1] || null, array[index+1] || null));
    }

    clear = async () => {
        for (let i = 0; i < 10; i++){
            await vMix.send({ Function: 'ReplayDeleteLastEvent' });
        }
    }

    show = async () => {
        await vMix.send({ Function: 'ReplayPlayAllEventsToOutput' });
    }

    add = (kills: ARGKillEntry[]) => {
        const allKills = [...this.kills, ...kills].filter(kill => kill.timestamp - 2000 >= now());
        this.kills = allKills;

        this.regenerate();
    }
}

