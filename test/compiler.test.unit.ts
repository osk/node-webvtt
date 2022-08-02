import { compile } from "../lib/compiler"
import parse from "../lib/parser";
import { CompilerError, Cue, EndsBeforeStarts, HeaderMeta, InvalidCueOrder, InvalidInput, VTT } from "../lib/types"

const DefaultText = 'Hello World!'

const ValidCue: Cue = {
  start: 0,
  end: 1,
  text: DefaultText,
}

const ValidMeta: HeaderMeta = {
  Kind: 'captions',
  Language: 'en',
  'X-TIMESTAMP-MAP=LOCAL': '00:00:00.000,MPEGTS:0'
}

const ValidMultipleCues: Array<Cue> = [
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

const ValidMultipleCuesOutput = [
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

const ValidMultipleCuesWithMilliseconds: Array<Cue> = [
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
]

const ValidMultipleCuesWithMillisecondsOutput = [
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
].join('\n')

const ValidCueNeedsRounding: Cue = {
  start: 135.9999,
  end: 140.0001,
  identifier: '1',
  text: 'Ta en kopp varmt te.\nDet är inte varmt.'  
}

const RoundedTimestamp = '00:02:15.999 --> 00:02:20.000';

function buildVTT(settings: Partial<VTT>): VTT {
  return { valid: true, strict: true, cues: [], ...settings }; 
}

describe('WebVTT compiler', () => {
  it('should compile valid input', () => {
    const input = buildVTT({ cues: [ValidCue] })
    expect(() => compile(input)).not.toThrow();
  });

  it('should not compile invalid input', () => {
    const input = buildVTT({ valid: false, cues: [ValidCue] })
    expect(() => compile(input)).toThrow(new CompilerError(InvalidInput));
  });

  it('should handle an identifier that is empty', () => {
    const input = buildVTT({ cues: [{ ...ValidCue, identifier: '' }] })
    expect(() => compile(input)).not.toThrow();
  });
  
  it('should not compile when cues have matching start and end times', () => {
    const input = buildVTT({ cues: [{ ...ValidCue, start: 1 }] });
    expect(() => compile(input)).toThrow(new CompilerError(EndsBeforeStarts(0)));
  });

  it('should compile multiple cues in valid format', () => {
    const input = buildVTT({ cues: ValidMultipleCues });
    expect(compile(input)).toBe(ValidMultipleCuesOutput);
  });

  it('should compile multiple cues and handle milliseconds properly', () => {
    const input = buildVTT({ cues: ValidMultipleCuesWithMilliseconds });
    expect(compile(input)).toBe(ValidMultipleCuesWithMillisecondsOutput);
  });

  it('should round properly when needed', () => {
    const input = buildVTT({ cues: [ValidCueNeedsRounding] });
    expect(compile(input)).toContain(RoundedTimestamp);
  });

  it('should compile parsed input back to its original source', () => {
    expect(compile(parse(ValidMultipleCuesOutput))).toBe(ValidMultipleCuesOutput);
  });

  it('should compile when styles are provided', () => {
    const input = buildVTT({ cues: [{ ...ValidCue, styles: 'align:start line:0%' }]});
    expect(compile(input)).toContain(`00:00:00.000 --> 00:00:01.000 align:start line:0%`)
  });

  it('should throw an error when start is Nan', () => {
    const input = buildVTT({ cues: [{ ...ValidCue, start: NaN }]});
    expect(() => compile(input)).toThrow(CompilerError);
  });

  it('should compile with metadata', () => {
    const input = buildVTT({ meta: ValidMeta, cues: [ValidCue] });
    expect(compile(input)).toContain('WEBVTT\nKind: captions\nLanguage: en\nX-TIMESTAMP-MAP=LOCAL: 00:00:00.000,MPEGTS:0');
  });

  it('should not compile when cues are in invalid order', () => {
    const input = buildVTT({ cues: [{ ...ValidCue, start: 30, end: 31 }, ValidCue]});
    expect(() => compile(input)).toThrow(new CompilerError(InvalidCueOrder(1)));
  });

  it('should allow cues that overlap in time', () => {
    const input = buildVTT({ cues: [ValidCue, { ...ValidCue, start: 0.5, end: 2 }]});
    expect(compile(input)).toBeTruthy();
  })
})