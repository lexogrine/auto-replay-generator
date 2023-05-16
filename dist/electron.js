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
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
exports.isDev = void 0;
/* eslint-disable no-console */
var electron_1 = require("electron");
var path_1 = __importDefault(require("path"));
var server_1 = require("./arg/server");
exports.isDev = process.env.DEV === 'true';
var createMainWindow = function () { return __awaiter(void 0, void 0, void 0, function () {
    var win, address;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (electron_1.app) {
                    electron_1.app.on('window-all-closed', electron_1.app.quit);
                    electron_1.app.on('before-quit', function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            if (!win)
                                return [2 /*return*/];
                            win.removeAllListeners('close');
                            win.close();
                            return [2 /*return*/];
                        });
                    }); });
                }
                win = new electron_1.BrowserWindow({
                    height: 435,
                    show: false,
                    frame: false,
                    titleBarStyle: 'hidden',
                    //resizable: isDev,
                    title: 'Lexogrine Auto Replay Generator',
                    icon: path_1["default"].join(__dirname, 'assets/icon.png'),
                    webPreferences: {
                        backgroundThrottling: false,
                        nodeIntegration: true,
                        preload: path_1["default"].join(__dirname, 'preload.js')
                        //devTools: isDev
                    },
                    minWidth: 775,
                    minHeight: 435,
                    width: 775
                });
                return [4 /*yield*/, (0, server_1.startWebSocketServer)(win)];
            case 1:
                address = _a.sent();
                electron_1.ipcMain.on('getAddress', function (ev) {
                    ev.reply('address', { ip: address.ip, port: address.port });
                });
                electron_1.ipcMain.on('getStatus', function (ev) {
                    var _a;
                    ev.reply('status', server_1.isConnected, ((_a = address.arg.netConPort.socket) === null || _a === void 0 ? void 0 : _a.native.readyState) === "open");
                });
                electron_1.ipcMain.on('min', function () {
                    win === null || win === void 0 ? void 0 : win.minimize();
                });
                electron_1.ipcMain.on('max', function () {
                    if (win === null || win === void 0 ? void 0 : win.isMaximized()) {
                        win === null || win === void 0 ? void 0 : win.restore();
                    }
                    else {
                        win === null || win === void 0 ? void 0 : win.maximize();
                    }
                });
                electron_1.ipcMain.on('close', function () {
                    win === null || win === void 0 ? void 0 : win.close();
                });
                win.once('ready-to-show', function () {
                    if (win) {
                        win.show();
                    }
                });
                // win.setMenu(null);
                win.setMenuBarVisibility(!exports.isDev);
                win.loadURL(exports.isDev ? 'http://localhost:3023' : "file://".concat(__dirname, "/build/index.html"));
                win.on('close', function () {
                    win = null;
                    electron_1.app.quit();
                });
                return [2 /*return*/];
        }
    });
}); };
var lock = electron_1.app.requestSingleInstanceLock();
if (!lock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('ready', createMainWindow);
}
