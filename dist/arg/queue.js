"use strict";
/**
 * Queue lifecycle after adding kill:
 *
 * 1. We clear all scheduled observing
 * 2. Get kills to show
 * 3. Schedule observing
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
exports.__esModule = true;
exports.ARGQueue = void 0;
var hlae_1 = require("./hlae");
var RADIUS_TIME = 1500;
var now = function () { return (new Date()).getTime(); };
var isKillBetter = function (killToCheck, killToCompare, allKills) {
    var killsOfPlayerOne = allKills.filter(function (kill) { return kill.killer === killToCheck.killer; }).length;
    var killsOfPlayerTwo = allKills.filter(function (kill) { return kill.killer === killToCompare.killer; }).length;
    if (killsOfPlayerOne > killsOfPlayerTwo) {
        return true;
    }
    else if (killsOfPlayerTwo > killsOfPlayerOne) {
        return false;
    }
    return allKills.indexOf(killToCheck) < allKills.indexOf(killToCompare);
};
var isKillWorthShowing = function (kill, allKills) {
    if (kill.killerHealth === 0)
        return false;
    var conflictingKills = allKills.filter(function (exampleKill) { return exampleKill !== kill && exampleKill.killer !== kill.killer && exampleKill.killerHealth > 0; }).filter(function (exampleKill) { return Math.abs(kill.timestamp - exampleKill.timestamp) <= RADIUS_TIME * 2; });
    if (!conflictingKills.length)
        return true;
    var conflictingAndBetterKills = conflictingKills.filter(function (conflicting) { return isKillBetter(kill, conflicting, allKills); });
    if (!conflictingAndBetterKills.length)
        return true;
    var willConflictedNotBeShown = conflictingAndBetterKills.every(function (conflicting) { return !isKillWorthShowing(conflicting, allKills); });
    if (willConflictedNotBeShown) {
        return true;
    }
    return false;
};
var ARGQueue = /** @class */ (function () {
    function ARGQueue(server) {
        var _this = this;
        this.swapToPlayer = function (name) {
            _this.pgl.execute("spec_player_by_name " + name);
        };
        this.generateSwap = function (kill) {
            var timeToExecute = kill.timestamp - RADIUS_TIME - now();
            var timeout = setTimeout(function () {
                _this.swapToPlayer(kill.name);
            }, timeToExecute);
            _this.swaps.push({ kill: kill, timeout: timeout });
        };
        this.regenerate = function () {
            _this.swaps.forEach(function (swap) { return clearTimeout(swap.timeout); });
            _this.swaps = [];
            var interestingKills = _this.kills.filter(function (kill) { return isKillWorthShowing(kill, _this.kills); });
            interestingKills.forEach(_this.generateSwap);
        };
        this.add = function (kill) {
            var kills = __spreadArray(__spreadArray([], _this.kills), [kill]).filter(function (kill) { return kill.timestamp - 2000 >= now(); });
            _this.kills = kills;
            _this.regenerate();
        };
        this.kills = [];
        this.swaps = [];
        this.pgl = new hlae_1.MIRVPGL(server);
    }
    return ARGQueue;
}());
exports.ARGQueue = ARGQueue;
// const arg = new ARGQueue();
