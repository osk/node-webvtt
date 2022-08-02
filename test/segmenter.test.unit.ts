import parse from "../lib/parser";
import { segment } from "../lib/segmenter";

const SingleCueInput = `WEBVTT

00:00.000 --> 00:05.000
a`;

const NonZeroStartInput = `WEBVTT

00:11.000 --> 00:15.000
a`;

const TwoSegmentsInput = `WEBVTT

00:00.000 --> 00:10.000
a

00:10.000 --> 00:19.000
a`;

const ShortWithSilenceInput = `WEBVTT

00:00.000 --> 00:01.000
a

00:11.000 --> 00:20.000
b`;

const OverlappingBoundaryInput = `WEBVTT

00:00.000 --> 00:11.000
a

00:11.000 --> 00:20.000
b`;

const OverlappingBoundaryInputWithSilence = `WEBVTT

00:11.000 --> 00:20.100
a

00:20.100 --> 00:22.000
b`;

const OverlapsMultipleBoundariesInput = `WEBVTT

00:00.000 --> 00:05.000
a

00:05.000 --> 00:11.000
b

00:11.000 --> 00:21.000
c

00:21.000 --> 00:31.000
d`;

describe("Segmenter", () => {
  it("should not segment a single cue", () => {
    const parseResult = parse(SingleCueInput);
    const segmentResult = segment(SingleCueInput);

    expect(parseResult.cues).toHaveLength(1);
    expect(segmentResult).toHaveLength(1);
    expect(segmentResult[0].cues[0]).toStrictEqual(
      parseResult.cues ? parseResult.cues[0] : undefined
    );
  });

  it("should return correct duration for single cue with start greater than 0", () => {
    const segmentResult = segment(NonZeroStartInput);
    expect(segmentResult).toHaveLength(1);
    expect(segmentResult[0].duration).toEqual(15);
  });

  it("should segment a short playlist in two parts with correct durations", () => {
    const segmentResult = segment(TwoSegmentsInput);
    expect(segmentResult).toHaveLength(2);
    expect(segmentResult[0].duration).toEqual(10);
    expect(segmentResult[1].duration).toEqual(9);
  });

  it("should segment a short playlist with silence appropriately", () => {
    const segmentResult = segment(ShortWithSilenceInput);
    expect(segmentResult).toHaveLength(2);
    expect(segmentResult[0].duration).toEqual(10);
    expect(segmentResult[1].duration).toEqual(10);
  });

  it("should correctly parse cues that cross the boundary line", () => {
    const segmentResult = segment(OverlappingBoundaryInput);
    expect(segmentResult).toHaveLength(2);
    expect(segmentResult[0].cues).toHaveLength(1);
    expect(segmentResult[1].cues).toHaveLength(2);
  });

  it("should correctly parse overlapping cues that do not start at 0", () => {
    const segmentResult = segment(OverlappingBoundaryInputWithSilence);
    expect(segmentResult).toHaveLength(2);
    expect(segmentResult[0].duration).toEqual(20);
    expect(segmentResult[1].duration).toEqual(2);
  });

  it("should handle crossing multiple segment boundaries", () => {
    const segmentResult = segment(OverlapsMultipleBoundariesInput);
    expect(segmentResult).toHaveLength(3);
  });
});
