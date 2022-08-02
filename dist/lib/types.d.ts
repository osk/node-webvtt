export declare class CompilerError extends Error {
    constructor(message: string);
}
export declare class ParserError extends Error {
    constructor(message: string);
}
export declare const InvalidInput = "Input must be valid";
export declare const InvalidCueOrder: (index: number) => string;
export declare const InvalidStart: (index: number) => string;
export declare const InvalidHeaderComment = "Header comment must start with a space or tab";
export declare const MalformedSignature = "Missing blank line after signature";
export declare const StandaloneCue: (index: number) => string;
export declare const IdentifierNoTimestamp: (index: number) => string;
export declare const InvalidCueTimestamp: (index: number) => string;
export declare const EndsBeforeStarts: (index: number) => string;
export declare type HeaderMeta = {
    [key: string]: string;
};
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
export interface HLSSegment {
    filename: string;
    content: string;
}
export interface ParserOptions {
    meta: boolean;
    strict: boolean;
    processMeta: boolean;
    convertToMs: boolean;
}
export interface ParsedCues {
    cues: Array<Cue>;
    errors: Array<ParserError>;
}
export declare const DefaultParserOptions: ParserOptions;
export interface Segment {
    duration: number;
    cues: Array<Cue>;
}
