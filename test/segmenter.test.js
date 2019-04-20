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

  it('should skip empty cues in segmenting', () => {
    const input = `WEBVTT

00:00.000 --> 00:01.000

01:11.000 --> 01:20.000
b`;
    const parsed = parse(input);
    const segmented = segment(input);

    parsed.cues.should.have.length(1);
    segmented.should.have.length(1);
    segmented[0].duration.should.equal(80);
    segmented[0].cues[0].should.deep.equal(parsed.cues[0]);
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

  it('should have right durations for segs on boundary w/longer end', () => {
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

  it('should segment an even longer playlist correctly', () => {
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
11

00:00:30.950 --> 00:00:33.230
12

00:00:33.320 --> 00:00:35.000
13

00:00:35.080 --> 00:00:37.400
14

00:00:37.520 --> 00:00:39.400
15

00:00:39.520 --> 00:00:42.600
16

00:00:42.720 --> 00:00:46.000
17

00:00:46.110 --> 00:00:48.200
18

00:00:48.280 --> 00:00:49.640
19

00:00:49.680 --> 00:00:52.600
20

00:00:52.680 --> 00:00:55.000
21

00:00:55.400 --> 00:00:56.470
22

00:00:58.720 --> 00:01:00.110
23

00:01:03.160 --> 00:01:04.200
24

00:01:43.840 --> 00:01:46.800
25

00:01:50.430 --> 00:01:53.110
26

00:01:54.840 --> 00:01:56.160
27

00:01:58.470 --> 00:02:02.840
28

00:02:03.840 --> 00:02:05.560
29

00:02:06.760 --> 00:02:07.720
30

00:02:07.800 --> 00:02:11.280
31

00:02:11.400 --> 00:02:14.320
32

00:02:14.430 --> 00:02:15.470
33

00:02:15.600 --> 00:02:17.920
34

00:02:18.000 --> 00:02:20.520
35

00:02:20.600 --> 00:02:23.110
36

00:02:23.200 --> 00:02:25.840
37

00:02:25.950 --> 00:02:29.800
38

00:02:29.870 --> 00:02:31.230
39

00:02:31.320 --> 00:02:33.280
40

00:02:33.560 --> 00:02:37.160
41

00:02:37.360 --> 00:02:39.560
42`;

    const parsed = parse(input);
    const segmented = segment(input);

    parsed.cues.should.have.length(43, 'parsed cues');
    segmented.should.have.length(13, 'segments');

    segmented[0].duration.should.equal(10, 'seg 1 duration');
    segmented[0].cues.length.should.equal(4, 'seg 1 count');

    segmented[1].duration.should.equal(10, 'seg 2 duration');
    segmented[1].cues.length.should.equal(5, 'seg 2 count');

    segmented[2].duration.should.equal(10, 'seg 3 duration');
    segmented[2].cues.length.should.equal(4, 'seg 3 count');

    segmented[3].duration.should.equal(10, 'seg 4 duration');
    segmented[3].cues.length.should.equal(6, 'seg 4 count');

    segmented[4].duration.should.equal(10, 'seg 5 duration');
    segmented[4].cues.length.should.equal(5, 'seg 5 count');

    segmented[5].duration.should.equal(10, 'seg 6 duration');
    segmented[5].cues.length.should.equal(4, 'seg 6 count');
    segmented[5].cues[0].should.deep.equal(parsed.cues[20], 'seg 6, cue 1');

    segmented[6].duration.should.equal(10, 'seg 7 duration');
    segmented[6].cues.length.should.equal(2, 'seg 7 count');

    segmented[7].duration.should.equal(40, 'seg 8 duration');
    segmented[7].cues.length.should.equal(1, 'seg 8 count');
    segmented[7].cues[0].should.deep.equal(parsed.cues[25], 'seg 8, cue 1');

    segmented[8].duration.should.equal(10, 'seg 9 duration');
    segmented[8].cues.length.should.equal(3, 'seg 9 count');
    segmented[8].cues[0].should.deep.equal(parsed.cues[26], 'seg 8, cue 1');

    segmented[9].duration.should.equal(10, 'seg 10 duration');
    segmented[9].cues.length.should.equal(4, 'seg 10 count');

    segmented[10].duration.should.equal(10, 'seg 11 duration');
    segmented[10].cues.length.should.equal(5, 'seg 11 count');

    segmented[11].duration.should.equal(10, 'seg 12 duration');
    segmented[11].cues.length.should.equal(5, 'seg 12 count');

    segmented[12].duration.should.equal(9.56, 'seg 13 duration');
    segmented[12].cues.length.should.equal(4, 'seg 13 count');
  });

  it('should segment correctly with silence in middle', () => {
    const input = `WEBVTT

00:05:49.720 --> 00:05:53.160
0

00:05:53.280 --> 00:05:55.400
1

00:06:00.470 --> 00:06:04.040
2

00:06:05.160 --> 00:06:06.800
3

00:06:45.640 --> 00:06:48.600
4

00:06:48.680 --> 00:06:51.230
5

00:06:51.320 --> 00:06:54.230
6

00:06:54.760 --> 00:06:56.320
7

00:06:56.430 --> 00:06:58.040
8

00:06:58.080 --> 00:06:59.600
9

00:06:59.680 --> 00:07:02.160
10`;

    const parsed = parse(input);
    const segmented = segment(input);

    parsed.cues.should.have.length(11, 'parsed cues');
    segmented.should.have.length(5, 'segments');
    segmented[0].duration.should.equal(350, 'seg 1 duration');
    segmented[0].cues.length.should.equal(1, 'seg 1 count');

    segmented[1].duration.should.equal(10, 'seg 2 duration');
    segmented[1].cues.length.should.equal(2, 'seg 2 count');

    segmented[2].duration.should.equal(10, 'seg 3 duration');
    segmented[2].cues.length.should.equal(2, 'seg 3 count');

    segmented[3].duration.should.equal(40, 'seg 4 duration');
    segmented[3].cues.length.should.equal(2, 'seg 4 count');

    segmented[4].duration.should.equal(12.16, 'seg 5 duration');
    segmented[4].cues.length.should.equal(6, 'seg 5 count');
  });

  it('should allow cues to intersect', () => {
    const input = `WEBVTT

00:00:00.000 --> 00:00:12.000
a

00:00:01.000 --> 00:00:13.000
b`;
    const parsed = parse(input);
    const segmented = segment(input);

    parsed.cues.should.have.length(2);
    segmented.should.have.length(1, 'One segment');
    segmented[0].duration.should.equal(13, 'Segment duration');
    segmented[0].cues.should.have.length(2, 'Segment cue count');
    segmented[0].cues[0].should.deep.equal(parsed.cues[0], 'First cue');
    segmented[0].cues[1].should.deep.equal(parsed.cues[1], 'Second cue');
  });

});
