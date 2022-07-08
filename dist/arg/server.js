"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.startWebSocketServer = exports.isConnected = void 0;
var simple_websockets_server_1 = require("simple-websockets-server");
var get_port_1 = __importDefault(require("get-port"));
var internal_ip_1 = __importDefault(require("internal-ip"));
var queue_1 = require("./queue");
var electron_1 = require("electron");
exports.isConnected = false;
var socketId = null;
var offset = 0;
var startWebSocketServer = function (win) { return __awaiter(void 0, void 0, void 0, function () {
    var port, ip, server, arg;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, get_port_1["default"]({ port: [1300, 1302, 1304, 1305, 1310] })];
            case 1:
                port = _a.sent();
                ip = internal_ip_1["default"].v4.sync();
                server = new simple_websockets_server_1.SimpleWebSocketServer({ port: port });
                arg = new queue_1.ARGQueue(server);
                electron_1.ipcMain.on('switchToPlayer', function (ev, name) {
                    arg.swapToPlayer({ name: name });
                });
                server.onConnection(function (socket) {
                    socket.on('register', function (order, saveClips, safeBand) {
                        if (exports.isConnected) {
                            socket._socket.close();
                            return;
                        }
                        if (order && Array.isArray(order)) {
                            queue_1.argConfig.order = order;
                        }
                        queue_1.argConfig.saveClips = !!saveClips;
                        queue_1.argConfig.preTime = safeBand.preTime;
                        queue_1.argConfig.postTime = safeBand.postTime;
                        socketId = socket;
                        exports.isConnected = true;
                        win.webContents.send('argStatus', true);
                        socket.send('registered');
                        socket.send('ntpPing', Date.now());
                    });
                    socket.on('ntpPong', function (t1, t2, t3) {
                        var t4 = Date.now();
                        offset = (t2 - t1 + (t3 - t4)) / 2;
                    });
                    socket.on('kills', function (kills) {
                        kills.forEach(function (kill) {
                            kill.timestamp -= offset;
                        });
                        arg.add(kills);
                    });
                    socket.on('config', function (order, saveClips, safeBand) {
                        queue_1.argConfig.order = order;
                        queue_1.argConfig.saveClips = saveClips;
                        queue_1.argConfig.preTime = safeBand.preTime;
                        queue_1.argConfig.postTime = safeBand.postTime;
                    });
                    socket.on('saveClips', function (saveClips) {
                        queue_1.argConfig.saveClips = saveClips;
                    });
                    socket.on('clearReplay', arg.clear);
                    socket.on('showReplay', arg.show);
                    socket.on('disconnect', function () {
                        if (socketId === socket) {
                            offset = 0;
                            exports.isConnected = false;
                            win.webContents.send('argStatus', false);
                        }
                    });
                });
                return [2 /*return*/, { ip: ip, port: port }];
        }
    });
}); };
exports.startWebSocketServer = startWebSocketServer;
