'use strict';

const chai = require('chai');
chai.should();

const parse = require('../lib/parser').parse;
const segment = require('../lib/segmenter').segment;

describe('WebVTT segment', () => {
  it('should not segment a single cue', () => {
    const input = `WEBVTT

00:00.000 --> 00:05.000
a`;
    const parsed = parse(input);
    const segmented = segment(input, 10);

    parsed.cues.should.have.length(1);
    segmented.should.have.length(1);

    segmented[0].cues[0].should.deep.equal(parsed.cues[0]);
  });

  it('should return correct duration for single cue w/start > 0', () => {
    const input = `WEBVTT

00:11.000 --> 00:15.000
a`;
    const segmented = segment(input, 10);

    segmented[0].duration.should.equal(15);
  });

  it('should segment a short playlist in two w/correct duration', () => {
    const input = `WEBVTT

00:00.000 --> 00:10.000
a

00:10.000 --> 00:19.000
a`;
    const parsed = parse(input);
    const segmented = segment(input);

    parsed.cues.should.have.length(2);
    segmented.should.have.length(2);
    segmented[0].duration.should.equal(10);
    segmented[0].cues[0].should.deep.equal(parsed.cues[0]);
    segmented[1].duration.should.equal(9);
    segmented[1].cues[0].should.deep.equal(parsed.cues[1]);
  });

  it('should segment a short playlist in two w/silence between', () => {
    const input = `WEBVTT

00:00.000 --> 00:01.000
a

00:11.000 --> 00:20.000
b`;
    const parsed = parse(input);
    const segmented = segment(input);

    parsed.cues.should.have.length(2);
    segmented.should.have.length(2);
    segmented[0].duration.should.equal(10);
    segmented[0].cues[0].should.deep.equal(parsed.cues[0]);
    segmented[1].duration.should.equal(10);
    segmented[1].cues[0].should.deep.equal(parsed.cues[1]);
  });

  it('should have cue that passes boundaries in two segments', () => {
    const input = `WEBVTT

00:00.000 --> 00:11.000
a

00:11.000 --> 00:20.000
b`;
    const parsed = parse(input);
    const segmented = segment(input, 10);

    parsed.cues.should.have.length(2);
    segmented.should.have.length(2);
    segmented[0].cues.should.have.length(1);
    segmented[0].cues[0].should.deep.equal(parsed.cues[0], 'First segment');
    segmented[1].cues.should.have.length(2);
    segmented[1].cues[0].should.deep.equal(parsed.cues[0], 'Boundary segment');
    segmented[1].cues[1].should.deep.equal(parsed.cues[1], 'Second segment');
  });

  it('should have corrct duration if boundary cues', () => {
    const input = `WEBVTT

00:11.000 --> 00:20.100
a

00:20.100 --> 00:22.000
b`;
    const parsed = parse(input);
    const segmented = segment(input, 10);

    parsed.cues.should.have.length(2);
    segmented.should.have.length(2);
    segmented[0].duration.should.equal(20, 'First segment duration');
    segmented[0].cues.should.have.length(1);
    segmented[0].cues[0].should.deep.equal(parsed.cues[0], 'First segment');
    segmented[1].duration.should.equal(2, 'Second segment duration');
    segmented[1].cues.should.have.length(2);
    segmented[1].cues[0].should.deep.equal(parsed.cues[0], 'Boundary segment');
    segmented[1].cues[1].should.deep.equal(parsed.cues[1], 'Second segment');
  });

  it('should segment four cues w/two boundaries', () => {
    const input = `WEBVTT

00:00.000 --> 00:05.000
a

00:05.000 --> 00:11.000
b

00:11.000 --> 00:21.000
c

00:21.000 --> 00:31.000
d`;
    const parsed = parse(input);
    const segs = segment(input, 10);

    parsed.cues.should.have.length(4, 'Correct amount of cues');
    segs.should.have.length(3, 'Correct amount of segments');
    segs[0].duration.should.equal(10, '1st segment duration');
    segs[0].cues.should.have.length(2, '1st segment cues');
    segs[0].cues[0].should.deep.equal(parsed.cues[0], '1st cue, 1st segment');
    segs[0].cues[1].should.deep.equal(parsed.cues[1], '2nd cue, 1st segment');

    segs[1].duration.should.equal(10, '2nd segment duration');
    segs[1].cues.should.have.length(2, '2nd segment cues');
    segs[1].cues[0].should.deep.equal(parsed.cues[1], '1st boundary cue');
    segs[1].cues[1].should.deep.equal(parsed.cues[2], '2nd cue, 2nd segment');

    segs[2].duration.should.equal(11, '3rd segment duration');
    segs[2].cues.should.have.length(2, '3rd segment cues');
    segs[2].cues[0].should.deep.equal(parsed.cues[2], '2nd boundary cue');
    segs[2].cues[1].should.deep.equal(parsed.cues[3], '2nd cue, 3rd segment');
  });

  it('should have correct durations for segments on boundary', () => {
    const input = `WEBVTT

00:00:09.000 --> 00:00:19.000
a

00:00:19.000 --> 00:00:20.000
b`;
    const parsed = parse(input);
    const segmented = segment(input);

    parsed.cues.should.have.length(2);
    segmented.should.have.length(2, 'Two segments');
    segmented[0].duration.should.equal(10, '1st segment duration');
    segmented[0].cues[0].should.deep.equal(parsed.cues[0]);
    segmented[1].duration.should.equal(10, '2nd segment duration');
    segmented[1].cues[0].should.deep.equal(parsed.cues[0]);
    segmented[1].cues[1].should.deep.equal(parsed.cues[1]);
  });

  it('should have correct durations for segments on boundary w/longer end', () => {
    const input = `WEBVTT

00:00:09.000 --> 00:00:19.000
a

00:00:19.000 --> 00:00:25.000
b`;
    const parsed = parse(input);
    const segmented = segment(input);

    parsed.cues.should.have.length(2);
    segmented.should.have.length(2, 'Two segments');
    segmented[0].duration.should.equal(10, '1st segment duration');
    segmented[0].cues[0].should.deep.equal(parsed.cues[0]);
    segmented[1].duration.should.equal(15, '2nd segment duration');
    segmented[1].cues[0].should.deep.equal(parsed.cues[0]);
    segmented[1].cues[1].should.deep.equal(parsed.cues[1]);
  });

  it('should segment correctly if silence between four cues', () => {
    const input = `WEBVTT

00:00:00.000 --> 00:00:01.000
a

00:00:30.000 --> 00:00:31.000
b

00:01:00.000 --> 00:01:01.000
c

00:01:50.000 --> 00:01:51.000
d`;
    const parsed = parse(input);
    const segmented = segment(input);

    parsed.cues.should.have.length(4);
    segmented.should.have.length(4);
    segmented[0].duration.should.equal(10, '1st segment duration');
    segmented[0].cues[0].should.deep.equal(parsed.cues[0]);
    segmented[1].duration.should.equal(30, '2nd segment duration');
    segmented[1].cues[0].should.deep.equal(parsed.cues[1]);
    segmented[2].duration.should.equal(30, '3rd segment duration');
    segmented[2].cues[0].should.deep.equal(parsed.cues[2]);
    segmented[3].duration.should.equal(41, '4th segment duration');
    segmented[3].cues[0].should.deep.equal(parsed.cues[3]);
  });

  it('should segment correctly when passing hours', () => {
    const input = `WEBVTT

00:59:00.000 --> 00:59:10.000
a

00:59:59.000 --> 01:00:11.000
b`;
    const parsed = parse(input);
    const segmented = segment(input);

    parsed.cues.should.have.length(2);
    segmented.should.have.length(2);
    segmented[0].duration.should.equal(3550);
    segmented[0].cues[0].should.deep.equal(parsed.cues[0]);
    segmented[1].duration.should.equal(61);
    segmented[1].cues[0].should.deep.equal(parsed.cues[1]);
  });

  it('should group many cues together in a segment', () => {
    const input = `WEBVTT

00:00:00.000 --> 00:00:11.360
a

00:00:11.430 --> 00:00:13.110
b

00:00:13.230 --> 00:00:15.430
c

00:00:15.520 --> 00:00:17.640
d

00:00:17.720 --> 00:00:19.950
e

00:01:43.840 --> 00:01:46.800
f`;

    const parsed = parse(input);
    const segmented = segment(input);

    parsed.cues.should.have.length(6, 'parsed cues');
    segmented.should.have.length(3, 'segments');
    segmented[0].duration.should.equal(10);
    segmented[0].cues[0].should.deep.equal(parsed.cues[0], 'seg 1, cue 1');
    segmented[1].duration.should.equal(10);
    segmented[1].cues.length.should.equal(5, 'seg 2 count');
    segmented[1].cues[0].should.deep.equal(parsed.cues[0], 'seg 2, cue 1');
    segmented[1].cues[1].should.deep.equal(parsed.cues[1], 'seg 2, cue 2');
    segmented[1].cues[2].should.deep.equal(parsed.cues[2], 'seg 2, cue 3');
    segmented[1].cues[3].should.deep.equal(parsed.cues[3], 'seg 2, cue 4');
    segmented[1].cues[4].should.deep.equal(parsed.cues[4], 'seg 2, cue 5');
    segmented[2].duration.should.equal(86.8);
    segmented[2].cues[0].should.deep.equal(parsed.cues[5], 'seg 3, cue 1');
  });

  it('should segment a longer playlist correctly', () => {
    const input = `WEBVTT

00:00:01.800 --> 00:00:05.160
0

00:00:05.400 --> 00:00:07.560
1

00:00:07.640 --> 00:00:09.600
2

00:00:09.720 --> 00:00:11.360
3

00:00:11.430 --> 00:00:13.110
4

00:00:13.230 --> 00:00:15.430
5

00:00:15.520 --> 00:00:17.640
6

00:00:17.720 --> 00:00:19.950
7

00:00:20.040 --> 00:00:23.760
8

00:00:23.870 --> 00:00:26.320
9

00:00:26.400 --> 00:00:28.560
10

00:00:28.640 --> 00:00:30.870
11`;

    const parsed = parse(input);
    const segmented = segment(input);

    parsed.cues.should.have.length(12, 'parsed cues');
    segmented.should.have.length(3, 'segments');
    segmented[0].duration.should.equal(10);
    segmented[0].cues.length.should.equal(4, 'seg 1 count');
    segmented[0].cues[0].should.deep.equal(parsed.cues[0], 'seg 1, cue 1');
    segmented[0].cues[1].should.deep.equal(parsed.cues[1], 'seg 1, cue 2');
    segmented[0].cues[2].should.deep.equal(parsed.cues[2], 'seg 1, cue 3');
    segmented[0].cues[3].should.deep.equal(parsed.cues[3], 'seg 1, cue 4');

    segmented[1].duration.should.equal(10);
    segmented[1].cues.length.should.equal(5, 'seg 2 count');
    segmented[1].cues[0].should.deep.equal(parsed.cues[3], 'seg 2, cue 1');
    segmented[1].cues[1].should.deep.equal(parsed.cues[4], 'seg 2, cue 2');
    segmented[1].cues[2].should.deep.equal(parsed.cues[5], 'seg 2, cue 3');
    segmented[1].cues[3].should.deep.equal(parsed.cues[6], 'seg 2, cue 4');
    segmented[1].cues[4].should.deep.equal(parsed.cues[7], 'seg 2, cue 5');

    segmented[2].duration.should.equal(10.87);
    segmented[2].cues.length.should.equal(4, 'seg 3 count');
    segmented[2].cues[0].should.deep.equal(parsed.cues[8], 'seg 3, cue 1');
    segmented[2].cues[1].should.deep.equal(parsed.cues[9], 'seg 3, cue 2');
    segmented[2].cues[2].should.deep.equal(parsed.cues[10], 'seg 3, cue 3');
    segmented[2].cues[3].should.deep.equal(parsed.cues[11], 'seg 3, cue 4');
  });
});
