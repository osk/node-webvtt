"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.segment = void 0;
var parser_1 = __importDefault(require("./parser"));
function alignToSegmentLength(n, length) {
    return n + length - (n % length);
}
function shouldSegment(totalElapsedTime, segmentLength, nextStart, silence) {
    var x = alignToSegmentLength(silence, segmentLength);
    var nextCueIsInNexSegment = silence <= segmentLength || x + totalElapsedTime < nextStart;
    return nextCueIsInNexSegment && nextStart - totalElapsedTime >= segmentLength;
}
function segmentDuration(lastCue, end, segmentLength, currentSegmentDuration, totalElapsedTime) {
    if (lastCue) {
        return parseFloat((end - totalElapsedTime).toFixed(2));
    }
    else if (currentSegmentDuration > segmentLength) {
        return alignToSegmentLength(currentSegmentDuration - segmentLength, segmentLength);
    }
    else {
        return Math.round(segmentLength);
    }
}
function segment(input, segmentLength, debug) {
    var _a, _b;
    if (segmentLength === void 0) { segmentLength = 10; }
    if (debug === void 0) { debug = false; }
    var parsed = (0, parser_1.default)(input);
    var numCues = (_b = (_a = parsed.cues) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
    if (!parsed.cues || numCues === 0) {
        return [];
    }
    var segments = [];
    var cues = [];
    var queuedCue = undefined;
    var totalElapsedTime = 0;
    var currentSegmentDuration = 0;
    parsed.cues.forEach(function (cue, index) {
        var firstCue = index === 0;
        var lastCue = index === numCues - 1;
        var cueLength = firstCue ? cue.end : cue.end - cue.start;
        var silence = firstCue ? 0 : cue.start - parsed.cues[index - 1].end;
        var nextStart = lastCue ? Infinity : parsed.cues[index + 1].start;
        if (debug) {
            console.log({
                firstCue: firstCue,
                lastCue: lastCue,
                start: cue.start,
                end: cue.end,
                cueLength: cueLength,
                silence: silence,
                nextStart: nextStart,
            });
        }
        currentSegmentDuration = currentSegmentDuration + cueLength + silence;
        if (queuedCue) {
            cues.push(queuedCue);
            currentSegmentDuration += queuedCue.end - totalElapsedTime;
            queuedCue = undefined;
        }
        cues.push(cue);
        var shouldCue = nextStart - cue.end < segmentLength &&
            silence < segmentLength &&
            currentSegmentDuration > segmentLength;
        var shouldSeg = shouldSegment(totalElapsedTime, segmentLength, nextStart, silence);
        if (shouldSeg) {
            var duration = segmentDuration(lastCue, cue.end, segmentLength, currentSegmentDuration, totalElapsedTime);
            segments.push({ duration: duration, cues: cues });
            totalElapsedTime += duration;
            currentSegmentDuration = 0;
            cues = [];
        }
        else {
            shouldCue = false;
        }
        if (shouldCue) {
            queuedCue = cue;
        }
    });
    return segments;
}
exports.segment = segment;
