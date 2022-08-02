import { readFileSync } from "fs";
import parse from "../lib/parser";
import {
  DefaultParserOptions,
  EndsBeforeStarts,
  IdentifierNoTimestamp,
  InvalidCueTimestamp,
  InvalidHeaderComment,
  MalformedSignature,
  ParserError,
  StandaloneCue,
} from "../lib/types";

const ProperVTT = `WEBVTT

00:00:00.000 --> 00:00:01.000
This is a test

00:00:01.000 --> 00:00:02.000
It has two cues`;

const NoWEBVTT = `00:00:00.000 --> 00:00:01.000
This is a test

00:00:01.000 --> 00:00:02.000
It has two cues`;

const NoWEBVTTWithMeta = `Header: meta

00:00:00.000 --> 00:00:01.000
This is a test

00:00:01.000 --> 00:00:02.000
It has two cues`;

const MultilineCues = `WEBVTT

00:00:00.000 --> 00:00:01.000
This is a test

00:00:01.000 --> 00:00:02.000
It it one cue
but has text on two lines`;

const LineFeedVTT = `WEBVTT\r\n
00:00:00.000 --> 00:00:01.000\r\n\
This is a test\r\r\
00:00:01.000 --> 00:00:02.000
It has two cues`;

const HeaderAttachedToFirstCue = `WEBVTT
00:00:00.000 --> 00:00:01.000
This is a test

00:00:01.000 --> 00:00:02.000
It has two cues`;

const MalformedHeaderMeta = `WEBVTTHeaderMetaDataUnseparated!

00:00:00.000 --> 00:00:01.000
This is a test

00:00:01.000 --> 00:00:02.000
It has two cues`;

const StandaloneCueErrorInput = `WEBVTT

text`;

const IdentifierNoTimestampInput = `WEBVTT

Cue #0
text`;

const MissingStartTime = `WEBVTT

--> 00:00:01.000
text`;

const MissingEndTime = `WEBVTT

00:00:00.000 -->
text`;

const MalformedStartTime = `WEBVTT

00;00;00.000 --> 00:00:01.000
text`;

const EndsBeforeStartsInput = `WEBVTT

00:00:01.000 --> 00:00:00.000
text`;

const StartEqualsEndInput = `WEBVTT

00:00:00.000 --> 00:00:00.000
text`;

const IllegalTimeStamp = `WEBVTT

0 --> 0
text`;

const LongHoursInput = `WEBVTT

1000:00:00.000 --> 1000:00:01.000
This is a test

10000:00:00.000 --> 10000:00:00.001
It has two cues`;

const WithStylesInput = `WEBVTT

1
00:00.000 --> 00:01.001 align:start line:0%
a
b`;

const OverlappingCuesInput = `WEBVTT

00:00:00.000 --> 00:00:12.000
a


00:00:01.000 --> 00:00:13.000
b`;

const ExtraWhitespaceInput = `WEBVTT

00:00.000 --> 00:00.001
a

`;

const WithHeaderCommentsInput = `WEBVTT header

00:00.000 --> 00:00.001
a`;

const WithNotesInput = `WEBVTT - Translation of that film I like

NOTE
This translation was done by Kyle so that
some friends can watch it with their parents.

1
00:02:15.000 --> 00:02:20.000
- Ta en kopp varmt te.
- Det är inte varmt.

2
00:02:20.000 --> 00:02:25.000
- Har en kopp te.
- Det smakar som te.

NOTE This last line may not translate well.

3
00:02:25.000 --> 00:02:30.000
- Ta en kopp`;

const BlankCueInput = `WEBVTT header

00:00.000 --> 00:00.001

3
00:02:25.000 --> 00:02:30.000
- Ta en kopp`;

const HeaderMetaInput = `WEBVTT
Kind: captions
Language: en

1
00:00.000 --> 00:00.001
a`;

const MalformedCue = `WEBVTT

MALFORMEDCUE -->
This text is from a malformed cue. It should not be processed.

1
00:00.000 --> 00:00.001
test`;

describe("WEBVTT Parser", () => {
  it("should parse empty string input as empty but valid VTT", () => {
    const parseResult = parse("");
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.meta).toBeFalsy();
    expect(parseResult.strict).toBeTruthy();
  });

  it("should parse the minimum WebVTT", () => {
    const parseResult = parse("WEBVTT");
    expect(parseResult.valid).toBeTruthy();
  });

  it("Should parse a properly formatted VTT file", () => {
    const parseResult = parse(ProperVTT);
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.cues).toHaveLength(2);
  });

  it("Should add WEBVTT to a file missing the header and then parse the cues appropriately", () => {
    const parseResult = parse(NoWEBVTT);
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.cues).toHaveLength(2);
  });

  it("should add WEBVTT and process meta before getting to cues", () => {
    const parseResult = parse(NoWEBVTTWithMeta, {
      ...DefaultParserOptions,
      meta: true,
    });
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.meta).toBeTruthy();
    expect(parseResult.meta!["Header"]).toBe("meta");
  });

  it("Should parse cues that have multiline text", () => {
    const parseResult = parse(MultilineCues);
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.cues).toHaveLength(2);
    expect(parseResult.cues![1].text).toBe(
      "It it one cue\nbut has text on two lines"
    );
  });

  it("Should parse WEBVTTs that have LF or CRLF", () => {
    const parseResult = parse(LineFeedVTT);
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.cues).toHaveLength(2);
  });

  it("Should parse a file where the WEBVTT header is not appropriately separated from the first cue", () => {
    const parseResult = parse(HeaderAttachedToFirstCue);
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.cues).toHaveLength(2);
  });

  it("Should throw an error for malformed header metadata comments", () => {
    expect(() => parse(MalformedHeaderMeta)).toThrow(
      new ParserError(InvalidHeaderComment)
    );
  });

  it("Should throw an error for standalone cues", () => {
    expect(() => parse(StandaloneCueErrorInput)).toThrow(
      new ParserError(StandaloneCue(0))
    );
  });

  it("Should throw an error if there is no timestamp between the identifier and text", () => {
    expect(() => parse(IdentifierNoTimestampInput)).toThrow(
      new ParserError(IdentifierNoTimestamp(0))
    );
  });

  it("Should throw errors when the timestamps are malformed or missing", () => {
    expect(() => parse(MissingStartTime)).toThrow(
      new ParserError(InvalidCueTimestamp(0))
    );
    expect(() => parse(MissingEndTime)).toThrow(
      new ParserError(InvalidCueTimestamp(0))
    );
    expect(() => parse(MalformedStartTime)).toThrow(
      new ParserError(InvalidCueTimestamp(0))
    );
    expect(() => parse(IllegalTimeStamp)).toThrow(
      new ParserError(InvalidCueTimestamp(0))
    );
  });

  it("Should enforce start time greater than end time", () => {
    expect(() => parse(EndsBeforeStartsInput)).toThrow(
      new ParserError(EndsBeforeStarts(0))
    );
    expect(() => parse(StartEqualsEndInput)).toThrow(
      new ParserError(EndsBeforeStarts(0))
    );
  });

  it("should parse long hours", () => {
    const parseResult = parse(LongHoursInput);
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.cues![1].start).toEqual(36000000);
    expect(parseResult.cues![1].end).toEqual(36000000.001);
  });

  it("should parse cues with styles", () => {
    const parseResult = parse(WithStylesInput);
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.cues).toHaveLength(1);
    expect(parseResult.cues![0].styles).toBe("align:start line:0%");
  });

  it("should parse overlapping cues", () => {
    const parseResult = parse(OverlappingCuesInput);
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.cues).toHaveLength(2);
    expect(parseResult.cues![0].end > parseResult.cues![1].start).toBeTruthy();
  });

  it("should process input with trailing lines", () => {
    const parseResult = parse(ExtraWhitespaceInput);
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.cues).toHaveLength(1);
  });

  it("should process header comments", () => {
    const parseResult = parse(WithHeaderCommentsInput);
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.cues).toHaveLength(1);
  });

  it("should process input with notes without adding them to the cues", () => {
    const parseResult = parse(WithNotesInput);
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.cues).toHaveLength(3);
  });

  it("should skip empty cues", () => {
    const parseResult = parse(BlankCueInput);
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.cues).toHaveLength(1);
  });

  it("should fail if metadata is present but not set and processMeta is true", () => {
    expect(() => parse(HeaderMetaInput)).toThrow(
      new ParserError(MalformedSignature)
    );
  });

  it("should not fail when meta is present if the meta flag is not set and processMeta is false", () => {
    const parseResult = parse(HeaderMetaInput, {
      ...DefaultParserOptions,
      meta: false,
      processMeta: false,
    });
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.cues).toHaveLength(1);
  });

  it("should return the meta if meta is set to true", () => {
    const parseResult = parse(HeaderMetaInput, {
      ...DefaultParserOptions,
      meta: true,
    });
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.meta!["Kind"]).toBe("captions");
  });

  it("should return undefined if meta is true but no meta is present", () => {
    const parseResult = parse(ProperVTT, {
      ...DefaultParserOptions,
      meta: true,
    });
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.meta).toBeFalsy();
  });

  it("should return false for strict if set to false", () => {
    const parseResult = parse(ProperVTT, {
      ...DefaultParserOptions,
      strict: false,
    });
    expect(parseResult.valid).toBeTruthy();
    expect(parseResult.strict).toBeFalsy();
  });

  it("should process a malformed cue if strict is false", () => {
    const parseResult = parse(MalformedCue, {
      ...DefaultParserOptions,
      strict: false,
    });
    expect(parseResult.valid).toBeFalsy();
    expect(parseResult.strict).toBeFalsy();
    expect(parseResult.errors).toHaveLength(1);
  });

  it("should parse the sample file acid.vtt without throwing errors with strict off", () => {
    const input = readFileSync("./test/data/acid.vtt").toString("utf8");
    const parseResult = parse(input, {
      ...DefaultParserOptions,
      strict: false,
    });
    expect(parseResult.valid).toBeFalsy();
    expect(parseResult.errors).toHaveLength(1);
    expect(parseResult.errors![0].message).toBe(InvalidCueTimestamp(14));
  });
});
