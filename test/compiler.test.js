'use strict';

const chai = require('chai');
chai.should();

const compiler = require('../lib/compiler');
const compile = compiler.compile;
const compilerError = compiler.CompilerError;
/**
 * Goals:
 * 1. Check number calculations are being done correctly
 * 2. Check that errors are/not being triggered
 * 3. Check that basic stuff is printed properly
 */

describe('WebVTT compiler', () => {
  it('should not compile undefined', () => {
    (() => { compile(); })
      .should.throw(compilerError, /Input must be a string/);
  });

  it('should not compile the empty subtitle', () => {
    (() => { compile(''); })
      .should.throw(compilerError, /WEBVTT/);
  });

  it('should not compile non-string subtitles', () => {
    (() => { compile(''); })
      .should.throw(compilerError, /WEBVTT/);
  });

  it('should throw when input does not start with WebVTT signature', () => {
    (() => { compile('FOO'); })
      .should.throw(compilerError, /WEBVTT/);
  });

  it('should compile the minimum WebVTT file, w/only signature', () => {
    compile('WEBVTT').should.have.property('valid').be.true;
  });

  it('should fail on missing newline after signature', () => {
    const input = `WEBVTT
Foo
`;

    (() => { compile(input); })
      .should.throw(compilerError, /blank line/);
  });

  it('should fail parsing cue with standalone identifier', () => {
    const input = `WEBVTT

1
`;

    (() => { compile(input); })
      .should.throw(compilerError, /Cue identifier cannot be standalone/);
  });

  it('should fail parsing cue with identifier but no timestamp', () => {
    const input = `WEBVTT

1
a`;

    (() => { compile(input); })
      .should.throw(compilerError, /needs to be followed by timestamp/);
  });

  it('should fail parsing cue with illegal timestamp', () => {
    const input = `WEBVTT

1
0 --> 0`;

    (() => { compile(input); })
      .should.throw(compilerError, /Invalid cue timestamp/);
  });

  it('should fail parsing cue with no min in timestamp', () => {
    const input = `WEBVTT

00:00.001 --> 00:00.000`;

    (() => { compile(input); })
      .should.throw(compilerError, /Start timestamp greater than end/);
  });

  it('should compile cue with legal timestamp and id', () => {
    const input = `WEBVTT

1
00:00.000 --> 00:00.001`;

    compile(input).cues[0].start.should.equal(0);
    compile(input).cues[0].end.should.equal(0.001);
  });

  it('should compile cue with legal timestamp, no id and text', () => {
    const input = `WEBVTT

00:00.000 --> 00:00.001
a`;

    compile(input).cues[0].start.should.equal(0);
    compile(input).cues[0].end.should.equal(0.001);
  });

  it('should return compiled data about a single cue', () => {
    const input = `WEBVTT

1
00:00.000 --> 00:01.001 align:start line:0%
a
b`;
    const compiled = { identifier: '1',
      start: 0,
      end: 1.001,
      text: 'a\nb',
      styles: 'align:start line:0%' };
    const res = compile(input);

    res.should.have.property('cues').with.length(1);
    res.cues[0].should.deep.equal(compiled);
  });

  it('should compile cue with mins & hours in timestamp', () => {
    const input = `WEBVTT

1
10:00.000 --> 01:00:00.000
a`;

    compile(input).cues[0].start.should.equal(600);
    compile(input).cues[0].end.should.equal(3600);
  });

  it('should compile intersecting cues', () => {
    const input = `WEBVTT

00:00:00.000 --> 00:00:12.000
a


00:00:01.000 --> 00:00:13.000
b`;

    compile(input).cues.should.have.length(2);
    compile(input).cues[0].start.should.equal(0);
    compile(input).cues[0].end.should.equal(12);
    compile(input).cues[1].start.should.equal(1);
    compile(input).cues[1].end.should.equal(13);
  });

  it('should fail parsing if start equal to end', () => {
    const input = `WEBVTT

00:00:00.000 --> 00:00:00.000`;

    (() => { compile(input); })
      .should.throw(compilerError, /End must be greater than start/);
  });

  it('should compile cue with trailing lines', () => {
    const input = `WEBVTT

00:00.000 --> 00:00.001
a

`;

    compile(input).cues[0].start.should.equal(0);
    compile(input).cues[0].end.should.equal(0.001);
  });

  it('should compile cue with one digit hours in timestamp', () => {
    const input = `WEBVTT

59:16.403 --> 1:04:13.283
Chapter 17`;

    compile(input).cues[0].start.should.equal(3556.403);
    compile(input).cues[0].end.should.equal(3853.283);
  });

  it('should allow a text header', () => {
    const input = `WEBVTT header

    00:00.000 --> 00:00.001
    a`;

    compile(input).cues[0].end.should.equal(0.001);
  });

  it('should not allow a text header w/o a space or tab after WEBVTT', () => {
    const input = `WEBVTTheader

    00:00.000 --> 00:00.001
    a`;
    (() => { compile(input); })
      .should.throw(compilerError, /Header comment must start with space or tab/);
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

    compile(input).cues.should.have.length(3);
  });
});
