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

    parse(input).cues[0].start.should.equal(0);
    parse(input).cues[0].end.should.equal(0.001);
  });

  it('should parse cue with legal timestamp, no id and text', () => {
    const input = `WEBVTT

00:00.000 --> 00:00.001
a`;

    parse(input).cues[0].start.should.equal(0);
    parse(input).cues[0].end.should.equal(0.001);
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

    parse(input).cues[0].start.should.equal(600);
    parse(input).cues[0].end.should.equal(3600);
  });

  it('should parse intersecting cues', () => {
    const input = `WEBVTT

00:00:00.000 --> 00:00:12.000
a


00:00:01.000 --> 00:00:13.000
b`;

    parse(input).cues.should.have.length(2);
    parse(input).cues[0].start.should.equal(0);
    parse(input).cues[0].end.should.equal(12);
    parse(input).cues[1].start.should.equal(1);
    parse(input).cues[1].end.should.equal(13);
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

    parse(input).cues[0].start.should.equal(0);
    parse(input).cues[0].end.should.equal(0.001);
  });

  it('should parse cue with one digit hours in timestamp', () => {
    const input = `WEBVTT

59:16.403 --> 1:04:13.283
Chapter 17`;

    parse(input).cues[0].start.should.equal(3556.403);
    parse(input).cues[0].end.should.equal(3853.283);
  });

  it('should allow a text header', () => {
    const input = `WEBVTT header

    00:00.000 --> 00:00.001
    a`;

    parse(input).cues[0].end.should.equal(0.001);
  });

  it('should not allow a text header w/o a space or tab after WEBVTT', () => {
    const input = `WEBVTTheader

    00:00.000 --> 00:00.001
    a`;
    (() => { parse(input); })
      .should.throw(parserError, /Header comment must start with space or tab/);
  });

  it('should allow NOTE for comments', () => {
    const input = `WEBVTT - Translation of that film I like

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

    parse(input).cues.should.have.length(3);
  });

  it('should not return meta by default', () => {
    const input = `WEBVTT

1
00:00.000 --> 00:00.001`;

    parse(input).should.have.property('valid').be.true;
    parse(input).should.not.have.property('meta');
  });

  it('should accept an options object', () => {
    const input = `WEBVTT

1
00:00.000 --> 00:00.001`;
    const options = { meta: true };

    parse(input, options).cues[0].start.should.equal(0);
    parse(input, options).cues[0].end.should.equal(0.001);
  });

  it('should fail if metadata exists but the meta option is not set', () => {
    const input = `WEBVTT
Kind: captions
Language: en

1
00:00.000 --> 00:00.001`;
    const options = { };

    (() => { parse(input, options); })
      .should.throw(parserError, /Missing blank line after signature/);
  });

  it('should fail if metadata exists but the meta option is false', () => {
    const input = `WEBVTT
Kind: captions
Language: en

1
00:00.000 --> 00:00.001`;
    const options = { meta: false };

    (() => { parse(input, options); })
      .should.throw(parserError, /Missing blank line after signature/);
  });

  it('should return meta if meta option is true', () => {
    const input = `WEBVTT
Kind: captions
Language: en

1
00:00.000 --> 00:00.001`;
    const options = { meta: true };

    parse(input, options).should.have.property('valid').be.true;
    parse(input, options).should.have.property('meta').be.deep.equal(
      { Kind: 'captions', Language: 'en' }
    );
  });

  it('should return null if meta option is true but no meta', () => {
    const input = `WEBVTT

1
00:00.000 --> 00:00.001`;
    const options = { meta: true };

    parse(input, options).should.have.property('valid').be.true;
    parse(input, options).should.have.property('meta').be.equal(null);
  });
});
