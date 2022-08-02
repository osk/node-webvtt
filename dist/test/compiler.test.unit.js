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
var compiler_1 = require("../lib/compiler");
var parser_1 = __importDefault(require("../lib/parser"));
var types_1 = require("../lib/types");
var DefaultText = 'Hello World!';
var ValidCue = {
    start: 0,
    end: 1,
    text: DefaultText,
};
var ValidMeta = {
    Kind: 'captions',
    Language: 'en',
    'X-TIMESTAMP-MAP=LOCAL': '00:00:00.000,MPEGTS:0'
};
var ValidMultipleCues = [
    {
        start: 135.001,
        end: 140,
        identifier: '1',
        text: 'Ta en kopp varmt te.\nDet är inte varmt.'
    },
    {
        start: 140,
        end: 145,
        identifier: '2',
        text: 'Har en kopp te.\nDet smakar som te.'
    },
    {
        start: 145,
        end: 150,
        identifier: '3',
        text: 'Ta en kopp'
    }
];
var ValidMultipleCuesOutput = [
    'WEBVTT',
    '',
    '1',
    '00:02:15.001 --> 00:02:20.000',
    'Ta en kopp varmt te.',
    'Det är inte varmt.',
    '',
    '2',
    '00:02:20.000 --> 00:02:25.000',
    'Har en kopp te.',
    'Det smakar som te.',
    '',
    '3',
    '00:02:25.000 --> 00:02:30.000',
    'Ta en kopp',
    ''
].join('\n');
var ValidMultipleCuesWithMilliseconds = [
    {
        start: 1199.529,
        end: 1199.539,
        identifier: '1',
        text: 'Ta en kopp varmt te.\nDet är inte varmt.'
    },
    {
        start: 1199.539,
        end: 1199.549,
        identifier: '2',
        text: 'Har en kopp te.\nDet smakar som te.'
    },
    {
        start: 1199.549,
        end: 1199.558,
        identifier: '3',
        text: 'Ta en kopp'
    }
];
var ValidMultipleCuesWithMillisecondsOutput = [
    'WEBVTT',
    '',
    '1',
    '00:19:59.529 --> 00:19:59.539',
    'Ta en kopp varmt te.',
    'Det är inte varmt.',
    '',
    '2',
    '00:19:59.539 --> 00:19:59.549',
    'Har en kopp te.',
    'Det smakar som te.',
    '',
    '3',
    '00:19:59.549 --> 00:19:59.558',
    'Ta en kopp',
    ''
].join('\n');
var ValidCueNeedsRounding = {
    start: 135.9999,
    end: 140.0001,
    identifier: '1',
    text: 'Ta en kopp varmt te.\nDet är inte varmt.'
};
var RoundedTimestamp = '00:02:15.999 --> 00:02:20.000';
function buildVTT(settings) {
    return __assign({ valid: true, strict: true, cues: [] }, settings);
}
describe('WebVTT compiler', function () {
    it('should compile valid input', function () {
        var input = buildVTT({ cues: [ValidCue] });
        expect(function () { return (0, compiler_1.compile)(input); }).not.toThrow();
    });
    it('should not compile invalid input', function () {
        var input = buildVTT({ valid: false, cues: [ValidCue] });
        expect(function () { return (0, compiler_1.compile)(input); }).toThrow(new types_1.CompilerError(types_1.InvalidInput));
    });
    it('should handle an identifier that is empty', function () {
        var input = buildVTT({ cues: [__assign(__assign({}, ValidCue), { identifier: '' })] });
        expect(function () { return (0, compiler_1.compile)(input); }).not.toThrow();
    });
    it('should not compile when cues have matching start and end times', function () {
        var input = buildVTT({ cues: [__assign(__assign({}, ValidCue), { start: 1 })] });
        expect(function () { return (0, compiler_1.compile)(input); }).toThrow(new types_1.CompilerError((0, types_1.EndsBeforeStarts)(0)));
    });
    it('should compile multiple cues in valid format', function () {
        var input = buildVTT({ cues: ValidMultipleCues });
        expect((0, compiler_1.compile)(input)).toBe(ValidMultipleCuesOutput);
    });
    it('should compile multiple cues and handle milliseconds properly', function () {
        var input = buildVTT({ cues: ValidMultipleCuesWithMilliseconds });
        expect((0, compiler_1.compile)(input)).toBe(ValidMultipleCuesWithMillisecondsOutput);
    });
    it('should round properly when needed', function () {
        var input = buildVTT({ cues: [ValidCueNeedsRounding] });
        expect((0, compiler_1.compile)(input)).toContain(RoundedTimestamp);
    });
    it('should compile parsed input back to its original source', function () {
        expect((0, compiler_1.compile)((0, parser_1.default)(ValidMultipleCuesOutput))).toBe(ValidMultipleCuesOutput);
    });
    it('should compile when styles are provided', function () {
        var input = buildVTT({ cues: [__assign(__assign({}, ValidCue), { styles: 'align:start line:0%' })] });
        expect((0, compiler_1.compile)(input)).toContain("00:00:00.000 --> 00:00:01.000 align:start line:0%");
    });
    it('should throw an error when start is Nan', function () {
        var input = buildVTT({ cues: [__assign(__assign({}, ValidCue), { start: NaN })] });
        expect(function () { return (0, compiler_1.compile)(input); }).toThrow(types_1.CompilerError);
    });
    it('should compile with metadata', function () {
        var input = buildVTT({ meta: ValidMeta, cues: [ValidCue] });
        expect((0, compiler_1.compile)(input)).toContain('WEBVTT\nKind: captions\nLanguage: en\nX-TIMESTAMP-MAP=LOCAL: 00:00:00.000,MPEGTS:0');
    });
    it('should not compile when cues are in invalid order', function () {
        var input = buildVTT({ cues: [__assign(__assign({}, ValidCue), { start: 30, end: 31 }), ValidCue] });
        expect(function () { return (0, compiler_1.compile)(input); }).toThrow(new types_1.CompilerError((0, types_1.InvalidCueOrder)(1)));
    });
    it('should allow cues that overlap in time', function () {
        var input = buildVTT({ cues: [ValidCue, __assign(__assign({}, ValidCue), { start: 0.5, end: 2 })] });
        expect((0, compiler_1.compile)(input)).toBeTruthy();
    });
});
