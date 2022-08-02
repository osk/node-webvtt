"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hlsSegmentPlaylist = exports.hlsSegment = void 0;
var segmenter_1 = require("./segmenter");
var time_convert_1 = require("./time-convert");
function printableCue(cue) {
    var _a;
    var printable = [];
    if (cue.identifier) {
        printable.push(cue.identifier);
    }
    var start = (0, time_convert_1.printableTimestamp)(cue.start);
    var end = (0, time_convert_1.printableTimestamp)(cue.end);
    var styles = (_a = cue.styles) !== null && _a !== void 0 ? _a : '';
    // always add a space after end timestamp, otherwise JWPlayer will not
    // handle cues correctly
    printable.push("".concat(start, " --> ").concat(end, " ").concat(styles));
    printable.push(cue.text);
    return printable.join('\n');
}
function printableCues(cues) {
    var result = [];
    cues.forEach(function (cue) {
        result.push(printableCue(cue));
    });
    return result.join('\n\n');
}
function generateSegmentFilename(index) {
    return "".concat(index, ".vtt");
}
function printableSegments(inputSegments) {
    var printableSegmentArray = [];
    inputSegments.forEach(function (inputSegment, index) {
        printableSegmentArray.push("#EXTINF:".concat(inputSegment.duration.toFixed(5), ",\n").concat(generateSegmentFilename(index)));
    });
    return printableSegmentArray.join('\n');
}
function findLongestSegment(inputSegments) {
    var max = -1;
    inputSegments.forEach(function (inputSegment) { return max = inputSegment.duration > max ? inputSegment.duration : max; });
    return max;
}
function buildHLSTemplate(printableSegmentString, longestSegment) {
    var header = '#EXTM3U';
    var targetDuration = "#EXT-X-TARGETDURATION:".concat(longestSegment);
    var version = '#EXT-X-VERSION:3';
    var mediaSequence = '#EXT-X-MEDIA-SEQUENCE:0';
    var playlistType = "#EXT-X-PLAYLIST-TYPE:VOD";
    var endList = '#EXT-X-ENDLIST';
    return [header, targetDuration, version, mediaSequence, playlistType, printableSegmentString, endList, ''].join('\n');
}
function hlsSegment(input, segmentLength, startOffset) {
    if (startOffset === void 0) { startOffset = 900000; }
    var inputSegments = (0, segmenter_1.segment)(input, segmentLength);
    var hlsSegments = [];
    inputSegments.forEach(function (segment, index) {
        var content = "WEBVTT\nX-TIMESTAMP-MAP=MPEGTS:".concat(startOffset, ",LOCAL:00:00:00.000\n\n").concat(printableCues(segment.cues), "\n");
        var filename = generateSegmentFilename(index);
        hlsSegments.push({ filename: filename, content: content });
    });
    return hlsSegments;
}
exports.hlsSegment = hlsSegment;
function hlsSegmentPlaylist(input, segmentLength) {
    var inputSegments = (0, segmenter_1.segment)(input, segmentLength);
    var printableSegmentString = printableSegments(inputSegments);
    var longestSegment = Math.round(findLongestSegment(inputSegments));
    return buildHLSTemplate(printableSegmentString, longestSegment);
}
exports.hlsSegmentPlaylist = hlsSegmentPlaylist;
