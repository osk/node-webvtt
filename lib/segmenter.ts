import parse from "./parser";
import { Cue, Segment } from "./types";

function alignToSegmentLength(n: number, length: number): number {
  return n + length - (n % length);
}

function shouldSegment(
  totalElapsedTime: number,
  segmentLength: number,
  nextStart: number,
  silence: number
): boolean {
  const x = alignToSegmentLength(silence, segmentLength);
  const nextCueIsInNexSegment =
    silence <= segmentLength || x + totalElapsedTime < nextStart;

  return nextCueIsInNexSegment && nextStart - totalElapsedTime >= segmentLength;
}

function segmentDuration(
  lastCue: boolean,
  end: number,
  segmentLength: number,
  currentSegmentDuration: number,
  totalElapsedTime: number
) {
  if (lastCue) {
    return parseFloat((end - totalElapsedTime).toFixed(2));
  } else if (currentSegmentDuration > segmentLength) {
    return alignToSegmentLength(
      currentSegmentDuration - segmentLength,
      segmentLength
    );
  } else {
    return Math.round(segmentLength);
  }
}

export function segment(
  input: string,
  segmentLength: number = 10,
  debug: boolean = false
): Array<Segment> {
  const parsed = parse(input);
  const numCues = parsed.cues?.length ?? 0;

  if (!parsed.cues || numCues === 0) {
    return [];
  }

  const segments: Array<Segment> = [];
  let cues: Array<Cue> = [];
  let queuedCue: undefined | Cue = undefined;
  let totalElapsedTime = 0;
  let currentSegmentDuration = 0;

  parsed.cues.forEach((cue, index) => {
    const firstCue = index === 0;
    const lastCue = index === numCues - 1;
    const cueLength = firstCue ? cue.end : cue.end - cue.start;
    const silence = firstCue ? 0 : cue.start - parsed.cues![index - 1].end;
    const nextStart = lastCue ? Infinity : parsed.cues![index + 1].start;

    if (debug) {
      console.log({
        firstCue,
        lastCue,
        start: cue.start,
        end: cue.end,
        cueLength,
        silence,
        nextStart,
      });
    }

    currentSegmentDuration = currentSegmentDuration + cueLength + silence;

    if (queuedCue) {
      cues.push(queuedCue);
      currentSegmentDuration += queuedCue.end - totalElapsedTime;
      queuedCue = undefined;
    }

    cues.push(cue);

    let shouldCue =
      nextStart - cue.end < segmentLength &&
      silence < segmentLength &&
      currentSegmentDuration > segmentLength;

    const shouldSeg = shouldSegment(
      totalElapsedTime,
      segmentLength,
      nextStart,
      silence
    );
    if (shouldSeg) {
      const duration = segmentDuration(
        lastCue,
        cue.end,
        segmentLength,
        currentSegmentDuration,
        totalElapsedTime
      );
      segments.push({ duration, cues });

      totalElapsedTime += duration;
      currentSegmentDuration = 0;
      cues = [];
    } else {
      shouldCue = false;
    }

    if (shouldCue) {
      queuedCue = cue;
    }
  });

  return segments;
}
