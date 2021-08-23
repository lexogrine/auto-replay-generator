"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var big_integer_1 = __importDefault(require("big-integer"));
function findDelim(buffer, idx) {
    var delim = -1;
    for (var i = idx; i < buffer.length; ++i) {
        if (0 == buffer[i]) {
            delim = i;
            break;
        }
    }
    return delim;
}
var BufferReader = /** @class */ (function () {
    function BufferReader(buffer) {
        var _this = this;
        this.readBigUInt64LE = function () {
            var lo = _this.readUInt32LE();
            var hi = _this.readUInt32LE();
            return big_integer_1["default"](lo).or(big_integer_1["default"](hi).shiftLeft(32));
        };
        this.readUInt32LE = function () {
            var result = _this.buffer.readUInt32LE(_this.index);
            _this.index += 4;
            return result;
        };
        this.readInt32LE = function () {
            var result = _this.buffer.readInt32LE(_this.index);
            _this.index += 4;
            return result;
        };
        this.readInt16LE = function () {
            var result = _this.buffer.readInt16LE(_this.index);
            _this.index += 2;
            return result;
        };
        this.readInt8 = function () {
            var result = _this.buffer.readInt8(_this.index);
            _this.index += 1;
            return result;
        };
        this.readUInt8 = function () {
            var result = _this.buffer.readUInt8(_this.index);
            _this.index += 1;
            return result;
        };
        this.readBoolean = function () {
            return 0 != _this.readUInt8();
        };
        this.readFloatLE = function () {
            var result = _this.buffer.readFloatLE(_this.index);
            _this.index += 4;
            return result;
        };
        this.readCString = function () {
            var delim = findDelim(_this.buffer, _this.index);
            if (_this.index <= delim) {
                var result = _this.buffer.toString('utf8', _this.index, delim);
                _this.index = delim + 1;
                return result;
            }
            throw new Error('BufferReader.prototype.readCString');
        };
        this.eof = function () {
            return _this.index >= _this.buffer.length;
        };
        this.buffer = buffer;
        this.index = 0;
    }
    return BufferReader;
}());
exports["default"] = BufferReader;
