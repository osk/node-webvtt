export type ParseOptions = {
  /**
   * if true, will parse the WebVTT metadata.
   *
   * if false, will throw if the WebVTT metadata exists.
   */
  meta?: boolean;
  strict?: boolean;
};

export type Cue = {
  identifier: string;
  start: number;
  end: number;
  text: string;
  styles: string;
};

export type Meta = Record<string, string>;

export type ParseOutput<T extends ParseOptions> = {
  valid: boolean;
  strict: T["strict"] extends boolean ? T["strict"] : boolean;
  cues: Cue[];
  errors: unknown[];
} & (T extends { meta: true } ? Meta : {});

export declare class ParserError extends Error {
  readonly message: string;
  constructor(message: string, error?: unknown);
}

/**
 * @throws {ParserError}
 */
export function parse<O extends ParseOptions>(
  input: string,
  options?: O
): ParseOutput<O>;

export type CompileInput = {
  valid: boolean;
  meta?: Meta;
  cues: Cue[];
};

export declare class CompilerError extends Error {
  readonly error: unknown;
  constructor(message: string, error?: unknown);
}

export function compile(input: CompileInput): string;

type Segment = {
  cues: Cue[];
  duration: number;
};

/**
 * @throws {ParserError}
 */
export function segment(
  input: string,
  segmentLength?: number | undefined
): Segment[];

type HlsSegment = {
  filename: string;
  content: string;
};

/**
 * @throws {ParserError}
 */
declare function hlsSegment(
  input: string,
  segmentLength?: number | undefined,
  startOffset?: string | undefined
): HlsSegment[];

/**
 * @throws {ParserError}
 */
declare function hlsSegmentPlaylist(
  input: string,
  segmentLength?: number | undefined
): string;

export const hls: {
  hlsSegment: typeof hlsSegment;
  hlsSegmentPlaylist: typeof hlsSegmentPlaylist;
};

declare const _default: {
  parse: typeof parse;
  compile: typeof compile;
  segment: typeof segment;
  hls: typeof hls;
};

export default _default;
