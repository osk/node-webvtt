'use strict';

const chai = require('chai');
chai.should();

const parser = require('../lib/parser');
const parse = parser.parse;
const parserError = parser.ParserError;

describe('WebVTT parser', () => {
  it('should not parse undefined', () => {
    (() => { parse(); })
      .should.throw(parserError, /Input must be a string/);
  });

  it('should not parse the empty subtitle', () => {
    (() => { parse(''); })
      .should.throw(parserError, /WEBVTT/);
  });

  it('should not parse non-string subtitles', () => {
    (() => { parse(''); })
      .should.throw(parserError, /WEBVTT/);
  });

  it('should throw when input does not start with WebVTT signature', () => {
    (() => { parse('FOO'); })
      .should.throw(parserError, /WEBVTT/);
  });

  it('should parse the minimum WebVTT file, w/only signature', () => {
    parse('WEBVTT').should.have.property('valid').be.true;
  });

  it('should fail on missing newline after signature', () => {
    const input = `WEBVTT
Foo
`;

    (() => { parse(input); })
      .should.throw(parserError, /blank line/);
  });

  it('should fail parsing cue with standalone identifier', () => {
    const input = `WEBVTT

1
`;

    (() => { parse(input); })
      .should.throw(parserError, /Cue identifier cannot be standalone/);
  });

  it('should fail parsing cue with identifier but no timestamp', () => {
    const input = `WEBVTT

1
a`;

    (() => { parse(input); })
      .should.throw(parserError, /needs to be followed by timestamp/);
  });

  it('should fail parsing cue with illegal timestamp', () => {
    const input = `WEBVTT

1
0 --> 0`;

    (() => { parse(input); })
      .should.throw(parserError, /Invalid cue timestamp/);
  });

  it('should fail parsing cue with no min in timestamp', () => {
    const input = `WEBVTT

00:00.001 --> 00:00.000`;

    (() => { parse(input); })
      .should.throw(parserError, /Start timestamp greater than end/);
  });

  it('should parse cue with legal timestamp and id', () => {
    const input = `WEBVTT

1
00:00.000 --> 00:00.001`;

    parse(input).should.have.deep.property('cues[0].start', 0);
    parse(input).should.have.deep.property('cues[0].end', 0.001);
  });

  it('should parse cue with legal timestamp, no id and text', () => {
    const input = `WEBVTT

00:00.000 --> 00:00.001
a`;

    parse(input).should.have.deep.property('cues[0].start', 0);
    parse(input).should.have.deep.property('cues[0].end', 0.001);
  });

  it('should return parsed data about a single cue', () => {
    const input = `WEBVTT

1
00:00.000 --> 00:01.001 align:start line:0%
a
b`;
    const parsed = { identifier: '1',
                     start: 0,
                     end: 1.001,
                     text: 'a\nb',
                     styles: 'align:start line:0%' };
    const res = parse(input);

    res.should.have.property('cues').with.length(1);
    res.cues[0].should.deep.equal(parsed);
  });

  it('should parse cue with mins & hours in timestamp', () => {
    const input = `WEBVTT

1
10:00.000 --> 01:00:00.000
a`;
    parse(input).should.have.deep.property('cues[0].start', 600);
    parse(input).should.have.deep.property('cues[0].end', 3600);
  });

  it('should parse intersecting cues', () => {
    const input = `WEBVTT

00:00:00.000 --> 00:00:12.000
a


00:00:01.000 --> 00:00:13.000
b`;

    parse(input).cues.should.have.length(2);
    parse(input).should.have.deep.property('cues[0].start', 0);
    parse(input).should.have.deep.property('cues[0].end', 12);
    parse(input).should.have.deep.property('cues[1].start', 1);
    parse(input).should.have.deep.property('cues[1].end', 13);
  });

  it('should fail parsing if start equal to end', () => {
    const input = `WEBVTT

00:00:00.000 --> 00:00:00.000`;

    (() => { parse(input); })
      .should.throw(parserError, /End must be greater than start/);
  });

  it('should parse cue with trailing lines', () => {
    const input = `WEBVTT

00:00.000 --> 00:00.001
a

`;

    parse(input).should.have.deep.property('cues[0].start', 0);
    parse(input).should.have.deep.property('cues[0].end', 0.001);
  });
});
