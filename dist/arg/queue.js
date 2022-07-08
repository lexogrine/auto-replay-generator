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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.ARGQueue = exports.argConfig = void 0;
var hlae_1 = require("./hlae");
var node_vmix_1 = require("node-vmix");
var electron_1 = require("electron");
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var configPath = path_1["default"].join(electron_1.app.getPath('userData'), 'config.json');
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
    preTime: 1500,
    postTime: 1500,
    saveClips: false
};
var config = { vMixAddress: 'localhost' };
if (fs_1["default"].existsSync(configPath)) {
    try {
        config = JSON.parse(fs_1["default"].readFileSync(configPath, 'utf-8'));
    }
    catch (_a) { }
}
else {
    fs_1["default"].writeFileSync(configPath, JSON.stringify(config), 'utf-8');
}
var vMix = new node_vmix_1.Connection((config === null || config === void 0 ? void 0 : config.vMixAddress) || 'localhost');
var ENABLE_VMIX = true;
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
    var conflictingKills = allKills
        .filter(function (exampleKill) { return exampleKill !== kill && exampleKill.killer !== kill.killer && exampleKill.killerHealth > 0; })
        .filter(function (exampleKill) { return Math.abs(kill.timestamp - exampleKill.timestamp) <= exports.argConfig.preTime + exports.argConfig.postTime; });
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
                _this.pgl.execute("spec_player_by_accountid " + player.steamid);
            }
            else if (player.name) {
                _this.pgl.execute("spec_player_by_name " + player.name);
            }
        };
        this.generateSwap = function (kill, prev, next) {
            var currentTime = Date.now();
            var timeToKill = kill.timestamp - currentTime;
            var timeToSwitch = 0;
            if (prev) {
                var timeToKillPrev = prev.timestamp - currentTime;
                timeToSwitch = (timeToKill + timeToKillPrev) / 2;
            }
            var timeout = setTimeout(function () {
                if (kill.weapon === 'hegrenade' && kill.victim) {
                    _this.swapToPlayer({ steamid: kill.victim });
                }
                else {
                    _this.swapToPlayer({ steamid: kill.killer });
                }
            }, timeToSwitch);
            var timeouts = [timeout];
            if (ENABLE_VMIX) {
                var timeToMarkIn = timeToKill - exports.argConfig.preTime;
                var timeToMarkOut = timeToKill + exports.argConfig.postTime;
                if (!prev || Math.abs(prev.timestamp - kill.timestamp) > exports.argConfig.preTime + exports.argConfig.postTime) {
                    var markInTimeout = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!vMix.connected()) return [3 /*break*/, 3];
                                    this.isRecordingNow = true;
                                    return [4 /*yield*/, vMix.send({ Function: 'ReplayLive' })];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, vMix.send({ Function: 'ReplayMarkIn' })];
                                case 2:
                                    _a.sent();
                                    _a.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); }, timeToMarkIn);
                    timeouts.push(markInTimeout);
                }
                if (!next || Math.abs(next.timestamp - kill.timestamp) > exports.argConfig.preTime + exports.argConfig.postTime) {
                    var markOutTimeout = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!vMix.connected()) return [3 /*break*/, 2];
                                    return [4 /*yield*/, vMix.send({ Function: 'ReplayMarkOut' })];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2:
                                    //console.log(`END REPLAY FRAGMENT [${kill.name} -> ${kill.victim || 'SOMEONE'}]`,now());
                                    this.isRecordingNow = false;
                                    if (this.playAfterRecording) {
                                        this.show();
                                    }
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
            if (_this.isRecordingNow || _this.isPlayingNow)
                return;
            _this.swaps.forEach(function (swap) { return swap.timeouts.forEach(function (timeout) { return clearTimeout(timeout); }); });
            _this.swaps = [];
            var interestingKills = _this.kills
                .filter(function (kill) { return isKillWorthShowing(kill, _this.kills); })
                .sort(function (a, b) { return a.timestamp - b.timestamp; });
            interestingKills.forEach(function (kill, index, array) {
                return _this.generateSwap(kill, array[index - 1] || null, array[index + 1] || null);
            });
        };
        this.clear = function () { return __awaiter(_this, void 0, void 0, function () {
            var i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.playAfterRecording = false;
                        setTimeout(function () {
                            if (vMix.connected())
                                vMix.send({ Function: 'ReplayStopEvents' });
                            //console.log(`ReplayStopEvents`,now());
                        }, 2000);
                        if (!vMix.connected()) return [3 /*break*/, 6];
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
                    case 0:
                        if (this.isRecordingNow) {
                            this.playAfterRecording = true;
                            return [2 /*return*/];
                        }
                        this.playAfterRecording = false;
                        if (!vMix.connected()) return [3 /*break*/, 2];
                        return [4 /*yield*/, vMix.send({ Function: 'ReplayPlayAllEventsToOutput' })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        }); };
        this.add = function (kills) {
            var nowTime = Date.now();
            var allKills = __spreadArrays(_this.kills, kills).filter(function (kill) { return kill.timestamp - 2000 >= nowTime; });
            _this.kills = allKills;
            _this.regenerate();
        };
        this.kills = [];
        this.swaps = [];
        this.pgl = new hlae_1.MIRVPGL(server);
        this.isPlayingNow = false;
        this.isRecordingNow = false;
        this.playAfterRecording = false;
    }
    return ARGQueue;
}());
exports.ARGQueue = ARGQueue;
