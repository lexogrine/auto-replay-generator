"use strict";
exports.__esModule = true;
exports.unserializeEnrichment = void 0;
var unserializeEnrichment = function (bufferReader, keyValue) {
    var xuid = bufferReader.readBigUInt64LE().toString();
    return {
        value: keyValue,
        xuid: xuid
    };
};
exports.unserializeEnrichment = unserializeEnrichment;
