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
      .should.throw(compilerError, /Input must be non-null/);
  });

  it('should not compile undefined', () => {
    (() => { compile(); })
      .should.throw(compilerError, /Input must be non-null/);
  });

  it('should not compile string', () => {
    (() => { compile('a'); })
      .should.throw(compilerError, /Input must be an object/);
  });

  it('should not compile array', () => {
    (() => { compile([]); })
      .should.throw(compilerError, /Input cannot be array/);
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

  it('should compile with accurate milliseconds', () => {

    const input = {
      cues: [{
        end: 1199.539,
        identifier: '1',
        start: 1199.529,
        styles: '',
        text: 'Ta en kopp varmt te.\nDet är inte varmt.'
      }, {
        end: 1199.549,
        identifier: '2',
        start: 1199.539,
        styles: '',
        text: 'Har en kopp te.\nDet smakar som te.'
      }, {
        end: 1199.558,
        identifier: '3',
        start: 1199.549,
        styles: '',
        text: 'Ta en kopp'
      }],
      valid: true
    };
    const output = `WEBVTT

1
00:19:59.529 --> 00:19:59.539
Ta en kopp varmt te.
Det är inte varmt.

2
00:19:59.539 --> 00:19:59.549
Har en kopp te.
Det smakar som te.

3
00:19:59.549 --> 00:19:59.558
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

  it('should not compile non string styles', () => {
    (() => {
      compile({
        cues: [{
          end: '1',
          identifier: '',
          start: '0',
          styles: 0,
          text: 'Hello world!'
        }], valid: true
      });
    })
      .should.throw(compilerError, /Cue malformed/);
  });

  it('should not compile non string text', () => {
    (() => {
      compile({
        cues: [{
          end: '1',
          identifier: '',
          start: '0',
          styles: '',
          text: 0
        }], valid: true
      });
    })
      .should.throw(compilerError, /Cue malformed/);
  });

  it('should not compile NaN start', () => {
    (() => {
      compile({
        cues: [{
          end: '1',
          identifier: '',
          start: NaN,
          styles: '',
          text: 'Hello world!'
        }], valid: true
      });
    })
      .should.throw(compilerError, /Cue malformed/);
  });

  it('should not compile non object cues', () => {
    (() => {
      compile({
        cues: [1], valid: true
      });
    })
      .should.throw(compilerError, /Cue malformed/);
  });

  it('should compile styles', () => {

    const input = {
      cues: [{
        end: 140,
        identifier: '1',
        start: 135.001,
        styles: 'align:start line:0%',
        text: 'Hello world'
      }],
      valid: true
    };
    const output = `WEBVTT

1
00:02:15.001 --> 00:02:20.000 align:start line:0%
Hello world
`;

    compile(input).should.equal(output);
  });

  it('should compile metadata', () => {
    const input = {
      meta: {
        Kind: 'captions',
        Language: 'en',
        'X-TIMESTAMP-MAP=LOCAL': '00:00:00.000,MPEGTS:0'
      },
      cues: [{
        end: 140,
        identifier: '1',
        start: 135.001,
        text: 'Hello world',
        styles: ''
      }],
      valid: true
    };

    const output = `WEBVTT
Kind: captions
Language: en
X-TIMESTAMP-MAP=LOCAL: 00:00:00.000,MPEGTS:0

1
00:02:15.001 --> 00:02:20.000
Hello world
`;

    compile(input).should.equal(output);
  });

  it('should not compile non-object metadata', () => {
    (() => {
      compile({ meta: [], cues: [], valid: true });
    })
      .should.throw(compilerError, /Metadata must be an object/);
  });

  it('should not compile non-string metadata values', () => {
    (() => {
      compile({ meta: { foo: [] }, cues: [], valid: true });
    })
      .should.throw(compilerError, /Metadata value for "foo" must be string/);
  });

  it('should not compile cues in non-chronological order', () => {
    const input = {
      valid: true,
      cues: [
        {
          identifier: '',
          start: 30,
          end: 31,
          text: 'This is a subtitle',
          styles: 'align:start line:0%'
        },
        {
          identifier: '',
          start: 0,
          end: 1,
          text: 'Hello world!',
          styles: ''
        }
      ]
    };

    (() => { compile(input); })
      .should.throw(compilerError,
        /Cue number \d+ is not in chronological order/
      );
  });

  it('should allow cues that overlap in time', () => {
    const input = {
      valid: true,
      cues: [
        {
          identifier: '',
          start: 1,
          end: 5,
          text: 'This is a subtitle',
          styles: 'align:start line:0%'
        },
        {
          identifier: '',
          start: 3,
          end: 7,
          text: 'Hello world!',
          styles: ''
        }
      ]
    };

    (() => { compile(input); })
      .should.not.throw(compilerError, /Cues must be in a chronological order/);
  });
});
