"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var parser_1 = __importDefault(require("../lib/parser"));
var segmenter_1 = require("../lib/segmenter");
var SingleCueInput = "WEBVTT\n\n00:00.000 --> 00:05.000\na";
var NonZeroStartInput = "WEBVTT\n\n00:11.000 --> 00:15.000\na";
var TwoSegmentsInput = "WEBVTT\n\n00:00.000 --> 00:10.000\na\n\n00:10.000 --> 00:19.000\na";
var ShortWithSilenceInput = "WEBVTT\n\n00:00.000 --> 00:01.000\na\n\n00:11.000 --> 00:20.000\nb";
var OverlappingBoundaryInput = "WEBVTT\n\n00:00.000 --> 00:11.000\na\n\n00:11.000 --> 00:20.000\nb";
var OverlappingBoundaryInputWithSilence = "WEBVTT\n\n00:11.000 --> 00:20.100\na\n\n00:20.100 --> 00:22.000\nb";
var OverlapsMultipleBoundariesInput = "WEBVTT\n\n00:00.000 --> 00:05.000\na\n\n00:05.000 --> 00:11.000\nb\n\n00:11.000 --> 00:21.000\nc\n\n00:21.000 --> 00:31.000\nd";
describe("Segmenter", function () {
    it("should not segment a single cue", function () {
        var parseResult = (0, parser_1.default)(SingleCueInput);
        var segmentResult = (0, segmenter_1.segment)(SingleCueInput);
        expect(parseResult.cues).toHaveLength(1);
        expect(segmentResult).toHaveLength(1);
        expect(segmentResult[0].cues[0]).toStrictEqual(parseResult.cues[0]);
    });
    it("should return correct duration for single cue with start greater than 0", function () {
        var segmentResult = (0, segmenter_1.segment)(NonZeroStartInput);
        expect(segmentResult).toHaveLength(1);
        expect(segmentResult[0].duration).toEqual(15);
    });
    it("should segment a short playlist in two parts with correct durations", function () {
        var segmentResult = (0, segmenter_1.segment)(TwoSegmentsInput);
        expect(segmentResult).toHaveLength(2);
        expect(segmentResult[0].duration).toEqual(10);
        expect(segmentResult[1].duration).toEqual(9);
    });
    it("should segment a short playlist with silence appropriately", function () {
        var segmentResult = (0, segmenter_1.segment)(ShortWithSilenceInput);
        expect(segmentResult).toHaveLength(2);
        expect(segmentResult[0].duration).toEqual(10);
        expect(segmentResult[1].duration).toEqual(10);
    });
    it("should correctly parse cues that cross the boundary line", function () {
        var segmentResult = (0, segmenter_1.segment)(OverlappingBoundaryInput);
        expect(segmentResult).toHaveLength(2);
        expect(segmentResult[0].cues).toHaveLength(1);
        expect(segmentResult[1].cues).toHaveLength(2);
    });
    it("should correctly parse overlapping cues that do not start at 0", function () {
        var segmentResult = (0, segmenter_1.segment)(OverlappingBoundaryInputWithSilence);
        expect(segmentResult).toHaveLength(2);
        expect(segmentResult[0].duration).toEqual(20);
        expect(segmentResult[1].duration).toEqual(2);
    });
    it("should handle crossing multiple segment boundaries", function () {
        var segmentResult = (0, segmenter_1.segment)(OverlapsMultipleBoundariesInput);
        expect(segmentResult).toHaveLength(3);
    });
});
