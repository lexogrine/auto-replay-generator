"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var GameEventDescription_1 = __importDefault(require("./GameEventDescription"));
var GameEventUnserializer = /** @class */ (function () {
    function GameEventUnserializer(enrichments) {
        var _this = this;
        this.unserialize = function (bufferReader) {
            var eventId = bufferReader.readInt32LE();
            if (eventId === 0) {
                var gameEvent_1 = new GameEventDescription_1["default"](bufferReader);
                _this.knownEvents[gameEvent_1.eventId] = gameEvent_1;
                if (_this.enrichments[gameEvent_1.eventName]) {
                    gameEvent_1.enrichments = _this.enrichments[gameEvent_1.eventName];
                }
                if (undefined === gameEvent_1)
                    throw new Error('GameEventUnserializer.prototype.unserialize');
                var result_1 = gameEvent_1.unserialize(bufferReader);
                return result_1;
            }
            var gameEvent = _this.knownEvents[eventId];
            if (undefined === gameEvent)
                throw new Error('GameEventUnserializer.prototype.unserialize');
            var result = gameEvent.unserialize(bufferReader);
            return result;
        };
        this.enrichments = enrichments;
        this.knownEvents = {}; // id -> description
    }
    return GameEventUnserializer;
}());
exports["default"] = GameEventUnserializer;
