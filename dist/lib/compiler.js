"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = void 0;
var time_convert_1 = require("./time-convert");
var types_1 = require("./types");
function compileCue(cue) {
    var cueAsString = cue.identifier ? "".concat(cue.identifier, "\n") : "";
    cueAsString += "".concat((0, time_convert_1.convertTimestamp)(cue.start), " --> ").concat((0, time_convert_1.convertTimestamp)(cue.end));
    cueAsString += cue.styles ? " ".concat(cue.styles, "\n") : "\n";
    cueAsString += cue.text;
    return cueAsString;
}
function compile(input) {
    var _a;
    if (!input.valid) {
        throw new types_1.CompilerError(types_1.InvalidInput);
    }
    var output = "WEBVTT\n";
    if (input.meta) {
        for (var key in input.meta) {
            output += "".concat(key, ": ").concat(input.meta[key], "\n");
        }
    }
    var previousTime = -1;
    (_a = input.cues) === null || _a === void 0 ? void 0 : _a.forEach(function (cue, index) {
        if (isNaN(cue.start)) {
            throw new types_1.CompilerError((0, types_1.InvalidStart)(index));
        }
        else if (cue.start < previousTime) {
            throw new types_1.CompilerError((0, types_1.InvalidCueOrder)(index));
        }
        else if (cue.end <= cue.start) {
            throw new types_1.CompilerError((0, types_1.EndsBeforeStarts)(index));
        }
        previousTime = cue.start;
        output += "\n".concat(compileCue(cue), "\n");
    });
    return output;
}
exports.compile = compile;
