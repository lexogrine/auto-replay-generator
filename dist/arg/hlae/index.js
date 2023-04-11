"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.NetConPort = void 0;
var net_1 = __importDefault(require("net"));
var telnet_stream_1 = require("telnet-stream");
var server_1 = require("../server");
var NetConPort = /** @class */ (function () {
    function NetConPort(win) {
        var _this = this;
        this.execute = function (command) {
            var _a, _b, _c;
            if (!((_a = _this.socket) === null || _a === void 0 ? void 0 : _a.telnet))
                return;
            if (((_b = _this.socket) === null || _b === void 0 ? void 0 : _b.native.readyState) === 'open') {
                (_c = _this.socket) === null || _c === void 0 ? void 0 : _c.telnet.write("".concat(command, "\n"));
            }
            else {
                console.log('COMMAND FAILED');
            }
        };
        this.cleanUpAndReconnect = function () {
            _this.socket = null;
            setTimeout(_this.connectToTelnet, 2000);
        };
        this.connectToTelnet = function () {
            if (_this.socket)
                return;
            try {
                var socket = net_1["default"].createConnection(2121, '127.0.0.1');
                var telnetSocket = new telnet_stream_1.TelnetSocket(socket);
                _this.socket = { telnet: telnetSocket, native: socket };
                socket.on('connect', function () {
                    var _a;
                    _this.win.webContents.send('status', server_1.isConnected, ((_a = _this.socket) === null || _a === void 0 ? void 0 : _a.native.readyState) === 'open');
                });
                socket.on('error', function () {
                    //console.log('ERROR');
                });
                socket.on('close', function () {
                    var _a;
                    _this.win.webContents.send('status', server_1.isConnected, ((_a = _this.socket) === null || _a === void 0 ? void 0 : _a.native.readyState) === 'open');
                    _this.cleanUpAndReconnect();
                });
            }
            catch (e) {
                console.log('REDOING someting');
                setTimeout(_this.connectToTelnet, 2000);
            }
        };
        this.socket = null;
        this.win = win;
        this.connectToTelnet();
    }
    return NetConPort;
}());
exports.NetConPort = NetConPort;
