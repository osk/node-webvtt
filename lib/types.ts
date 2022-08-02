// Error Classes
export class CompilerError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, CompilerError.prototype);
  }
}

export class ParserError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ParserError.prototype);
  }
}

// Error Messages
export const InvalidInput = 'Input must be valid';
export const InvalidCueOrder = (index: number) => `Cues must be in chronological order (cue #${index})`;
export const InvalidStart = (index: number) => `Invalid start time (NaN) (cue #${index})`;
export const InvalidHeaderComment = 'Header comment must start with a space or tab';
export const MalformedSignature = 'Missing blank line after signature';
export const StandaloneCue = (index: number) => `Cue identifier cannot be standalone (cue #${index})`;
export const IdentifierNoTimestamp = (index: number) => `Cue identifier needs to be followed by timestamp (cue #${index})`;
export const InvalidCueTimestamp = (index: number) => `Invalid cue timestamp (cue #${index})`;
export const EndsBeforeStarts = (index: number) => `Cue cannot have end time less than or equal to start time (cue #${index})`;

// General Types
export type HeaderMeta = { [key: string]: string };

export interface Cue {
  identifier?: string;
  start: number;
  end: number;
  text: string;
  styles?: string;
}

export interface VTT {
  valid: boolean;
  strict: boolean;
  cues?: Array<Cue>;
  errors?: Array<ParserError>;
  meta?: HeaderMeta;
}

// HLS Types
export interface HLSSegment {
  filename: string;
  content: string;
}

// Parser Types
export interface ParserOptions {
  meta: boolean; // informs the parser that meta is expected
  strict: boolean; // informs the parser to throw errors. In false mode swallows errors and returns as a list
  processMeta: boolean; // informs the parser if meta should be processed.
  convertToMs: boolean; // when true, returns time in terms of milliseconds instead of seconds
}

export interface ParsedCues {
  cues: Array<Cue>;
  errors: Array<ParserError>;
}

export const DefaultParserOptions: ParserOptions = {
  meta: false,
  strict: true,
  processMeta: true,
  convertToMs: false,
};

// Segmenter Types
export interface Segment {
  duration: number;
  cues: Array<Cue>;
}