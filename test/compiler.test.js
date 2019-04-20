'use strict';

const chai = require('chai');
chai.should();

const compiler = require('../lib/compiler');
const compilerError = compiler.CompilerError;
const compile = compiler.compile;

const parser = require('../lib/parser');
const parse = parser.parse;

describe('WebVTT compiler', () => {

  it('should not compile null', () => {
    (() => { compile(null); })
      .should.throw(compilerError, /null/);
  });

  it('should not compile undefined', () => {
    (() => { compile(); })
      .should.throw(compilerError, /Input/);
  });

  it('should not compile string', () => {
    (() => { compile(''); })
      .should.throw(compilerError, /Input/);
  });

  it('should not compile array', () => {
    (() => { compile([]); })
      .should.throw(compilerError, /Input/);
  });

  it('should compile object', () => {
    (() => {
      compile({
        cues: [{
          end: 1,
          identifier: '',
          start: 0,
          styles: '',
          text: 'Hello world!'
        }], valid: true
      });
    })
      .should.not.throw(compilerError, /valid/);
  });

  it('should not compile invalid cue', () => {
    (() => {
      compile({
        cues: [{
          end: 1,
          identifier: '',
          start: 0,
          styles: '',
          text: 'Hello world!'
        }], valid: false
      });
    })
      .should.throw(compilerError, /valid/);
  });

  it('should compile string identifier', () => {
    (() => {
      compile({
        cues: [{
          end: 1,
          identifier: 'chance',
          start: 0,
          styles: '',
          text: 'Hello world!'
        }], valid: true
      });
    })
      .should.not.throw(compilerError, /identifier value/);
  });

  it('should compile empty identifier', () => {
    (() => {
      compile({
        cues: [{
          end: 1,
          identifier: '',
          start: 0,
          styles: '',
          text: 'Hello world!'
        }], valid: true
      });
    })
      .should.not.throw(compilerError, /identifier value/);
  });

  it('should compile null identifier', () => {
    (() => {
      compile({
        cues: [{
          end: 1,
          identifier: null,
          start: 0,
          styles: '',
          text: 'Hello world!'
        }], valid: true
      });
    })
      .should.not.throw(compilerError, /identifier value/);
  });

  it('should compile numeric identifier', () => {
    (() => {
      compile({
        cues: [{
          end: 1,
          identifier: 1,
          start: 0,
          styles: '',
          text: 'Hello world!'
        }], valid: true
      });
    })
      .should.not.throw(compilerError, /identifier value/);
  });

  it('should not compile object cue', () => {
    (() => {
      compile({
        cues: [{
          end: 1,
          identifier: {},
          start: 0,
          styles: '',
          text: 'Hello world!'
        }], valid: true
      });
    })
      .should.throw(compilerError, /identifier value/);
  });

  it('should compile cues with numeric start', () => {
    (() => {
      compile({
        cues: [{
          end: 1,
          identifier: '',
          start: '0',
          styles: '',
          text: 'Hello world!'
        }], valid: true
      });
    })
      .should.not.throw(compilerError, /Cue malformed/);
  });

  it('should compile cues with numeric end', () => {
    (() => {
      compile({
        cues: [{
          end: '1',
          identifier: '',
          start: 0,
          styles: '',
          text: 'Hello world!'
        }], valid: true
      });
    })
      .should.not.throw(compilerError, /Cue malformed/);
  });

  it('should not compile cues with non-numeric end', () => {
    (() => {
      compile({
        cues: [{
          end: '1a',
          identifier: '',
          start: 0,
          styles: '',
          text: 'Hello world!'
        }], valid: true
      });
    })
      .should.throw(compilerError, /Cue malformed/);
  });

  it('should not compile equal start and end times', () => {
    (() => {
      compile({
        cues: [{
          end: 1,
          identifier: '',
          start: 1,
          styles: '',
          text: 'Hello world!'
        }], valid: true
      });
    })
      .should.throw(compilerError, /Cue malformed/);
  });

  it('should not compile non-string text', () => {
    (() => {
      compile({
        cues: [{
          end: 1,
          identifier: {},
          start: 0,
          styles: '',
          text: 1
        }], valid: true
      });
    })
      .should.throw(compilerError, /Cue malformed/);
  });

  it('should not compile non-string styles', () => {
    (() => {
      compile({
        cues: [{
          end: 1,
          identifier: {},
          start: 0,
          styles: null,
          text: ''
        }], valid: true
      });
    })
      .should.throw(compilerError, /Cue malformed/);
  });

  it('should compile properly', () => {

    const input = {
      cues: [{
        end: 140,
        identifier: '1',
        start: 135.001,
        styles: '',
        text: 'Ta en kopp varmt te.\nDet är inte varmt.'
      }, {
        end: 145,
        identifier: '2',
        start: 140,
        styles: '',
        text: 'Har en kopp te.\nDet smakar som te.'
      }, {
        end: 150,
        identifier: '3',
        start: 145,
        styles: '',
        text: 'Ta en kopp'
      }],
      valid: true
    };
    const output = `WEBVTT

1
00:02:15.001 --> 00:02:20.000
Ta en kopp varmt te.
Det är inte varmt.

2
00:02:20.000 --> 00:02:25.000
Har en kopp te.
Det smakar som te.

3
00:02:25.000 --> 00:02:30.000
Ta en kopp
`;

    compile(input).should.equal(output);
  });

  it('should round properly', () => {

    const input = {
      cues: [{
        end: 140.0001,
        identifier: '1',
        start: 135.9999,
        styles: '',
        text: 'Ta en kopp varmt te.\nDet är inte varmt.'
      }],
      valid: true
    };
    const output = `WEBVTT

1
00:02:15.999 --> 00:02:20.000
Ta en kopp varmt te.
Det är inte varmt.
`;

    compile(input).should.equal(output);
  });

  it('should compile string start and end times', () => {
    (() => {
      compile({
        cues: [{
          end: '1',
          identifier: '',
          start: '0',
          styles: '',
          text: 'Hello world!'
        }], valid: false
      });
    })
      .should.not.throw(compilerError, /Timestamp/);
  });

  it('should be reversible', () => {

    const input = `WEBVTT

1
00:02:15.001 --> 00:02:20.000
Ta en kopp varmt te.
Det är inte varmt.

2
00:02:20.000 --> 00:02:25.000
Har en kopp te.
Det smakar som te.

3
00:02:25.000 --> 00:02:30.000
Ta en kopp
`;
    compile(parse(input)).should.equal(input);
  });
});
