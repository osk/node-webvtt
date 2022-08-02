import { segment } from "./segmenter";
import { printableTimestamp } from "./time-convert";
import { Cue, HLSSegment, Segment } from "./types";

function printableCue (cue: Cue) {
  const printable: Array<string> = [];

  if (cue.identifier) {
    printable.push(cue.identifier);
  }

  const start = printableTimestamp(cue.start);
  const end = printableTimestamp(cue.end);

  const styles = cue.styles ?? '';

  // always add a space after end timestamp, otherwise JWPlayer will not
  // handle cues correctly
  printable.push(`${start} --> ${end} ${styles}`);

  printable.push(cue.text);

  return printable.join('\n');
}

function printableCues (cues: Array<Cue>): string {
  const result: Array<string> = [];
  cues.forEach((cue) => {
    result.push(printableCue(cue));
  });

  return result.join('\n\n');
}

function generateSegmentFilename(index: number): string {
  return `${index}.vtt`;
}

function printableSegments(inputSegments: Array<Segment>): string {
  const printableSegmentArray: Array<string> = [];
  inputSegments.forEach((inputSegment, index) => {
      printableSegmentArray.push(`#EXTINF:${inputSegment.duration.toFixed(5)},\n${generateSegmentFilename(index)}`);
    });
  return printableSegmentArray.join('\n');
}

function findLongestSegment(inputSegments: Array<Segment>): number {
  let max = -1;
  inputSegments.forEach((inputSegment) => max = inputSegment.duration > max ? inputSegment.duration : max);
  return max;
}

function buildHLSTemplate(printableSegmentString: string, longestSegment: number): string{
  const header = '#EXTM3U';
  const targetDuration = `#EXT-X-TARGETDURATION:${longestSegment}`;
  const version = '#EXT-X-VERSION:3';
  const mediaSequence = '#EXT-X-MEDIA-SEQUENCE:0';
  const playlistType = `#EXT-X-PLAYLIST-TYPE:VOD`;
  const endList = '#EXT-X-ENDLIST';
  return [header, targetDuration, version, mediaSequence, playlistType, printableSegmentString, endList, ''].join('\n')
}

export function hlsSegment (input: string, segmentLength: number, startOffset: number = 900000): Array<HLSSegment> {
  const inputSegments = segment(input, segmentLength);
  const hlsSegments: Array<HLSSegment> = [];
  inputSegments.forEach((segment, index) => {
    const content = `WEBVTT\nX-TIMESTAMP-MAP=MPEGTS:${startOffset},LOCAL:00:00:00.000\n\n${printableCues(segment.cues)}\n`;
    const filename = generateSegmentFilename(index);
    hlsSegments.push({ filename, content });
  });
  return hlsSegments;
}

export function hlsSegmentPlaylist (input: string, segmentLength: number): string {
  const inputSegments = segment(input, segmentLength);
  const printableSegmentString = printableSegments(inputSegments);
  const longestSegment= Math.round(findLongestSegment(inputSegments));
  return buildHLSTemplate(printableSegmentString, longestSegment);
}