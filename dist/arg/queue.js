"use strict";
/**
 * Queue lifecycle after adding kill:
 *
 * 1. We clear all scheduled observing
 * 2. Get kills to show
 * 3. Schedule observing
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.ARGQueue = exports.argConfig = void 0;
var hlae_1 = require("./hlae");
var node_vmix_1 = require("node-vmix");
exports.argConfig = {
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
    saveClips: false
};
var vMix = new node_vmix_1.Connection("localhost");
var RADIUS_TIME = 1500;
var ENABLE_VMIX = true;
var now = function () { return (new Date()).getTime(); };
var comparisons = {
    multikills: function (killToCheck, killToCompare, allKills) {
        var killsOfPlayerOne = allKills.filter(function (kill) { return kill.killer === killToCheck.killer; }).length;
        var killsOfPlayerTwo = allKills.filter(function (kill) { return kill.killer === killToCompare.killer; }).length;
        if (killsOfPlayerOne > killsOfPlayerTwo) {
            return true;
        }
        else if (killsOfPlayerTwo > killsOfPlayerOne) {
            return false;
        }
        return null;
    },
    headshots: function (killToCheck, killToCompare) {
        if (killToCheck.headshot === killToCompare.headshot)
            return null;
        return killToCheck.headshot;
    },
    teamkill: function (killToCheck, killToCompare) {
        if (killToCheck.teamkill === killToCompare.teamkill)
            return null;
        return killToCheck.teamkill;
    }
};
var isKillBetter = function (killToCheck, killToCompare, allKills) {
    var order = exports.argConfig.order.filter(function (item) { return item.active; }).map(function (item) { return item.id; });
    for (var _i = 0, order_1 = order; _i < order_1.length; _i++) {
        var orderType = order_1[_i];
        if (orderType in comparisons) {
            var result = comparisons[orderType](killToCheck, killToCompare, allKills);
            if (result === null)
                continue;
            return result;
        }
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
        this.swapToPlayer = function (player) {
            if (player.steamid) {
                _this.pgl.execute("spec_player_by_accountid ".concat(player.steamid));
            }
            else if (player.name) {
                _this.pgl.execute("spec_player_by_name ".concat(player.name));
            }
        };
        this.generateSwap = function (kill, prev, next) {
            var timeToKill = kill.timestamp - now();
            var timeToExecute = timeToKill - RADIUS_TIME;
            var timeout = setTimeout(function () {
                _this.swapToPlayer({ steamid: kill.killer });
            }, timeToExecute);
            var timeouts = [timeout];
            if (ENABLE_VMIX) {
                var timeToMarkIn = timeToKill - RADIUS_TIME;
                var timeToMarkOut = timeToKill + RADIUS_TIME;
                if (!prev || Math.abs(prev.timestamp - kill.timestamp) > RADIUS_TIME * 2) {
                    var markInTimeout = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, vMix.send({ Function: 'ReplayLive' })];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, vMix.send({ Function: 'ReplayMarkIn' })];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); }, timeToMarkIn);
                    timeouts.push(markInTimeout);
                }
                if (!next || Math.abs(next.timestamp - kill.timestamp) > RADIUS_TIME * 2) {
                    var markOutTimeout = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, vMix.send({ Function: 'ReplayMarkOut' })];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); }, timeToMarkOut);
                    timeouts.push(markOutTimeout);
                }
            }
            _this.swaps.push({ kill: kill, timeouts: timeouts });
        };
        this.regenerate = function () {
            _this.swaps.forEach(function (swap) { return swap.timeouts.forEach(function (timeout) { return clearTimeout(timeout); }); });
            _this.swaps = [];
            var interestingKills = _this.kills.filter(function (kill) { return isKillWorthShowing(kill, _this.kills); }).sort(function (a, b) { return a.timestamp - b.timestamp; });
            interestingKills.forEach(function (kill, index, array) { return _this.generateSwap(kill, array[index - 1] || null, array[index + 1] || null); });
        };
        this.clear = function () { return __awaiter(_this, void 0, void 0, function () {
            var i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 10)) return [3 /*break*/, 6];
                        if (!exports.argConfig.saveClips) return [3 /*break*/, 3];
                        return [4 /*yield*/, vMix.send({ Function: 'ReplayMoveLastEvent', Value: '9' })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, vMix.send({ Function: 'ReplayDeleteLastEvent' })];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        this.show = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, vMix.send({ Function: 'ReplayPlayAllEventsToOutput' })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        this.add = function (kills) {
            var allKills = __spreadArray(__spreadArray([], _this.kills, true), kills, true).filter(function (kill) { return kill.timestamp - 2000 >= now(); });
            _this.kills = allKills;
            _this.regenerate();
        };
        this.kills = [];
        this.swaps = [];
        this.pgl = new hlae_1.MIRVPGL(server);
    }
    return ARGQueue;
}());
exports.ARGQueue = ARGQueue;
