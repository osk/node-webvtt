import { HLSSegment } from "./types";
export declare function hlsSegment(input: string, segmentLength: number, startOffset?: number): Array<HLSSegment>;
export declare function hlsSegmentPlaylist(input: string, segmentLength: number): string;
