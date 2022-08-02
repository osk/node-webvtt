"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var parser_1 = __importDefault(require("../lib/parser"));
var types_1 = require("../lib/types");
var ProperVTT = "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nThis is a test\n\n00:00:01.000 --> 00:00:02.000\nIt has two cues";
var NoWEBVTT = "00:00:00.000 --> 00:00:01.000\nThis is a test\n\n00:00:01.000 --> 00:00:02.000\nIt has two cues";
var NoWEBVTTWithMeta = "Header: meta\n\n00:00:00.000 --> 00:00:01.000\nThis is a test\n\n00:00:01.000 --> 00:00:02.000\nIt has two cues";
var MultilineCues = "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nThis is a test\n\n00:00:01.000 --> 00:00:02.000\nIt it one cue\nbut has text on two lines";
var LineFeedVTT = "WEBVTT\r\n\n00:00:00.000 --> 00:00:01.000\r\nThis is a test\r\r00:00:01.000 --> 00:00:02.000\nIt has two cues";
var HeaderAttachedToFirstCue = "WEBVTT\n00:00:00.000 --> 00:00:01.000\nThis is a test\n\n00:00:01.000 --> 00:00:02.000\nIt has two cues";
var MalformedHeaderMeta = "WEBVTTHeaderMetaDataUnseparated!\n\n00:00:00.000 --> 00:00:01.000\nThis is a test\n\n00:00:01.000 --> 00:00:02.000\nIt has two cues";
var StandaloneCueErrorInput = "WEBVTT\n\ntext";
var IdentifierNoTimestampInput = "WEBVTT\n\nCue #0\ntext";
var MissingStartTime = "WEBVTT\n\n--> 00:00:01.000\ntext";
var MissingEndTime = "WEBVTT\n\n00:00:00.000 -->\ntext";
var MalformedStartTime = "WEBVTT\n\n00;00;00.000 --> 00:00:01.000\ntext";
var EndsBeforeStartsInput = "WEBVTT\n\n00:00:01.000 --> 00:00:00.000\ntext";
var StartEqualsEndInput = "WEBVTT\n\n00:00:00.000 --> 00:00:00.000\ntext";
var IllegalTimeStamp = "WEBVTT\n\n0 --> 0\ntext";
var LongHoursInput = "WEBVTT\n\n1000:00:00.000 --> 1000:00:01.000\nThis is a test\n\n10000:00:00.000 --> 10000:00:00.001\nIt has two cues";
var WithStylesInput = "WEBVTT\n\n1\n00:00.000 --> 00:01.001 align:start line:0%\na\nb";
var OverlappingCuesInput = "WEBVTT\n\n00:00:00.000 --> 00:00:12.000\na\n\n\n00:00:01.000 --> 00:00:13.000\nb";
var ExtraWhitespaceInput = "WEBVTT\n\n00:00.000 --> 00:00.001\na\n\n";
var WithHeaderCommentsInput = "WEBVTT header\n\n00:00.000 --> 00:00.001\na";
var WithNotesInput = "WEBVTT - Translation of that film I like\n\nNOTE\nThis translation was done by Kyle so that\nsome friends can watch it with their parents.\n\n1\n00:02:15.000 --> 00:02:20.000\n- Ta en kopp varmt te.\n- Det \u00E4r inte varmt.\n\n2\n00:02:20.000 --> 00:02:25.000\n- Har en kopp te.\n- Det smakar som te.\n\nNOTE This last line may not translate well.\n\n3\n00:02:25.000 --> 00:02:30.000\n- Ta en kopp";
var BlankCueInput = "WEBVTT header\n\n00:00.000 --> 00:00.001\n\n3\n00:02:25.000 --> 00:02:30.000\n- Ta en kopp";
var HeaderMetaInput = "WEBVTT\nKind: captions\nLanguage: en\n\n1\n00:00.000 --> 00:00.001\na";
var MalformedCue = "WEBVTT\n\nMALFORMEDCUE -->\nThis text is from a malformed cue. It should not be processed.\n\n1\n00:00.000 --> 00:00.001\ntest";
describe("WEBVTT Parser", function () {
    it("should parse empty string input as empty but valid VTT", function () {
        var parseResult = (0, parser_1.default)("");
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.meta).toBeFalsy();
        expect(parseResult.strict).toBeTruthy();
    });
    it("should parse the minimum WebVTT", function () {
        var parseResult = (0, parser_1.default)("WEBVTT");
        expect(parseResult.valid).toBeTruthy();
    });
    it("Should parse a properly formatted VTT file", function () {
        var parseResult = (0, parser_1.default)(ProperVTT);
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.cues).toHaveLength(2);
    });
    it("Should add WEBVTT to a file missing the header and then parse the cues appropriately", function () {
        var parseResult = (0, parser_1.default)(NoWEBVTT);
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.cues).toHaveLength(2);
    });
    it("should add WEBVTT and process meta before getting to cues", function () {
        var parseResult = (0, parser_1.default)(NoWEBVTTWithMeta, __assign(__assign({}, types_1.DefaultParserOptions), { meta: true }));
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.meta).toBeTruthy();
        expect(parseResult.meta["Header"]).toBe("meta");
    });
    it("Should parse cues that have multiline text", function () {
        var parseResult = (0, parser_1.default)(MultilineCues);
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.cues).toHaveLength(2);
        expect(parseResult.cues[1].text).toBe("It it one cue\nbut has text on two lines");
    });
    it("Should parse WEBVTTs that have LF or CRLF", function () {
        var parseResult = (0, parser_1.default)(LineFeedVTT);
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.cues).toHaveLength(2);
    });
    it("Should parse a file where the WEBVTT header is not appropriately separated from the first cue", function () {
        var parseResult = (0, parser_1.default)(HeaderAttachedToFirstCue);
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.cues).toHaveLength(2);
    });
    it("Should throw an error for malformed header metadata comments", function () {
        expect(function () { return (0, parser_1.default)(MalformedHeaderMeta); }).toThrow(new types_1.ParserError(types_1.InvalidHeaderComment));
    });
    it("Should throw an error for standalone cues", function () {
        expect(function () { return (0, parser_1.default)(StandaloneCueErrorInput); }).toThrow(new types_1.ParserError((0, types_1.StandaloneCue)(0)));
    });
    it("Should throw an error if there is no timestamp between the identifier and text", function () {
        expect(function () { return (0, parser_1.default)(IdentifierNoTimestampInput); }).toThrow(new types_1.ParserError((0, types_1.IdentifierNoTimestamp)(0)));
    });
    it("Should throw errors when the timestamps are malformed or missing", function () {
        expect(function () { return (0, parser_1.default)(MissingStartTime); }).toThrow(new types_1.ParserError((0, types_1.InvalidCueTimestamp)(0)));
        expect(function () { return (0, parser_1.default)(MissingEndTime); }).toThrow(new types_1.ParserError((0, types_1.InvalidCueTimestamp)(0)));
        expect(function () { return (0, parser_1.default)(MalformedStartTime); }).toThrow(new types_1.ParserError((0, types_1.InvalidCueTimestamp)(0)));
        expect(function () { return (0, parser_1.default)(IllegalTimeStamp); }).toThrow(new types_1.ParserError((0, types_1.InvalidCueTimestamp)(0)));
    });
    it("Should enforce start time greater than end time", function () {
        expect(function () { return (0, parser_1.default)(EndsBeforeStartsInput); }).toThrow(new types_1.ParserError((0, types_1.EndsBeforeStarts)(0)));
        expect(function () { return (0, parser_1.default)(StartEqualsEndInput); }).toThrow(new types_1.ParserError((0, types_1.EndsBeforeStarts)(0)));
    });
    it("should parse long hours", function () {
        var parseResult = (0, parser_1.default)(LongHoursInput);
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.cues[1].start).toEqual(36000000);
        expect(parseResult.cues[1].end).toEqual(36000000.001);
    });
    it("should parse cues with styles", function () {
        var parseResult = (0, parser_1.default)(WithStylesInput);
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.cues).toHaveLength(1);
        expect(parseResult.cues[0].styles).toBe("align:start line:0%");
    });
    it("should parse overlapping cues", function () {
        var parseResult = (0, parser_1.default)(OverlappingCuesInput);
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.cues).toHaveLength(2);
        expect(parseResult.cues[0].end > parseResult.cues[1].start).toBeTruthy();
    });
    it("should process input with trailing lines", function () {
        var parseResult = (0, parser_1.default)(ExtraWhitespaceInput);
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.cues).toHaveLength(1);
    });
    it("should process header comments", function () {
        var parseResult = (0, parser_1.default)(WithHeaderCommentsInput);
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.cues).toHaveLength(1);
    });
    it("should process input with notes without adding them to the cues", function () {
        var parseResult = (0, parser_1.default)(WithNotesInput);
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.cues).toHaveLength(3);
    });
    it("should skip empty cues", function () {
        var parseResult = (0, parser_1.default)(BlankCueInput);
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.cues).toHaveLength(1);
    });
    it("should fail if metadata is present but not set and processMeta is true", function () {
        expect(function () { return (0, parser_1.default)(HeaderMetaInput); }).toThrow(new types_1.ParserError(types_1.MalformedSignature));
    });
    it("should not fail when meta is present if the meta flag is not set and processMeta is false", function () {
        var parseResult = (0, parser_1.default)(HeaderMetaInput, __assign(__assign({}, types_1.DefaultParserOptions), { meta: false, processMeta: false }));
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.cues).toHaveLength(1);
    });
    it("should return the meta if meta is set to true", function () {
        var parseResult = (0, parser_1.default)(HeaderMetaInput, __assign(__assign({}, types_1.DefaultParserOptions), { meta: true }));
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.meta["Kind"]).toBe("captions");
    });
    it("should return undefined if meta is true but no meta is present", function () {
        var parseResult = (0, parser_1.default)(ProperVTT, __assign(__assign({}, types_1.DefaultParserOptions), { meta: true }));
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.meta).toBeFalsy();
    });
    it("should return false for strict if set to false", function () {
        var parseResult = (0, parser_1.default)(ProperVTT, __assign(__assign({}, types_1.DefaultParserOptions), { strict: false }));
        expect(parseResult.valid).toBeTruthy();
        expect(parseResult.strict).toBeFalsy();
    });
    it("should process a malformed cue if strict is false", function () {
        var parseResult = (0, parser_1.default)(MalformedCue, __assign(__assign({}, types_1.DefaultParserOptions), { strict: false }));
        expect(parseResult.valid).toBeFalsy();
        expect(parseResult.strict).toBeFalsy();
        expect(parseResult.errors).toHaveLength(1);
    });
    it("should parse the sample file acid.vtt without throwing errors with strict off", function () {
        var input = (0, fs_1.readFileSync)("./test/data/acid.vtt").toString("utf8");
        var parseResult = (0, parser_1.default)(input, __assign(__assign({}, types_1.DefaultParserOptions), { strict: false }));
        expect(parseResult.valid).toBeFalsy();
        expect(parseResult.errors).toHaveLength(1);
        expect(parseResult.errors[0].message).toBe((0, types_1.InvalidCueTimestamp)(14));
    });
});
