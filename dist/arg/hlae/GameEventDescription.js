"use strict";
exports.__esModule = true;
var UseridEnrichment_1 = require("./UseridEnrichment");
var GameEventDescription = /** @class */ (function () {
    function GameEventDescription(bufferReader) {
        var _this = this;
        this.unserialize = function (bufferReader) {
            var clientTime = bufferReader.readFloatLE();
            var result = {
                name: _this.eventName,
                clientTime: clientTime,
                keys: {}
            };
            for (var i = 0; i < _this.keys.length; ++i) {
                var key = _this.keys[i];
                var keyName = key.name;
                var keyValue = void 0;
                switch (key.type) {
                    case 1:
                        keyValue = bufferReader.readCString();
                        break;
                    case 2:
                        keyValue = bufferReader.readFloatLE();
                        break;
                    case 3:
                        keyValue = bufferReader.readInt32LE();
                        break;
                    case 4:
                        keyValue = bufferReader.readInt16LE();
                        break;
                    case 5:
                        keyValue = bufferReader.readInt8();
                        break;
                    case 6:
                        keyValue = bufferReader.readBoolean();
                        break;
                    case 7:
                        keyValue = bufferReader.readBigUInt64LE();
                        break;
                    default:
                        throw new Error('GameEventDescription.prototype.unserialize');
                }
                result.keys[key.name] = keyValue;
                if (_this.enrichments && _this.enrichments.includes(keyName)) {
                    result.keys[key.name] = UseridEnrichment_1.unserializeEnrichment(bufferReader, keyValue);
                }
            }
            return result;
        };
        this.eventId = bufferReader.readInt32LE();
        this.eventName = bufferReader.readCString();
        this.keys = [];
        this.enrichments = null;
        while (bufferReader.readBoolean()) {
            var keyName = bufferReader.readCString();
            var keyType = bufferReader.readInt32LE();
            this.keys.push({
                name: keyName,
                type: keyType
            });
        }
    }
    return GameEventDescription;
}());
exports["default"] = GameEventDescription;
