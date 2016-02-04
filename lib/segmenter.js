'use strict';

const parse = require('./parser').parse;

function segment (input, segmentLength) {
  segmentLength = segmentLength || 10;

  const parsed = parse(input);
  const segments = [];

  let cues = [];
  let queuedCue = null;
  let currentSegmentDuration = 0;
  let totalSegmentsDuration = 0;

  /**
   * One pass segmenting of cues
   */
  parsed.cues.forEach((cue, i) => {
    const firstCue = i === 0;
    const lastCue = i === parsed.cues.length - 1;
    const start = cue.start;
    const end = cue.end;
    const nextStart = lastCue ? Infinity : parsed.cues[i + 1].start;
    const nextEnd = lastCue ? Infinity : parsed.cues[i + 1].end;
    const cueLength = firstCue ? end : end - start;
    const silence = firstCue ? 0 : (start - parsed.cues[i - 1].end);
    const segmentLengthAfterNext = nextEnd - nextStart + currentSegmentDuration;

    currentSegmentDuration = currentSegmentDuration + cueLength + silence;

    debug('------------');
    debug(`Cue #${i}, segment #${segments.length + 1}`);
    debug(`Start ${start}`);
    debug(`End ${end}`);
    debug(`Length ${cueLength}`);
    debug(`Total segment duration = ${totalSegmentsDuration}`);
    debug(`Current segment duration = ${currentSegmentDuration}`);
    debug(`Start of next = ${nextStart}`);
    debug(`Segment length after next = ${segmentLengthAfterNext}`);

    // if there's a boundary cue queued, push and clear queue
    // don't clear it until end of loop since we need to look at it
    if (queuedCue) {
      cues.push(queuedCue);
      currentSegmentDuration += queuedCue.end - totalSegmentsDuration;
    }

    cues.push(cue);

    // but is the start in the current segment?
    const nextIsInNewSegment = nextStart - totalSegmentsDuration >=
                                segmentLength;

    // if a cue passes a segment boundary, it appears in both
    // since we might have a queued cue, mark that we should queue and do at end
    const shouldQueue = (lastCue || nextStart - end < segmentLength) &&
                      silence < segmentLength &&
                      currentSegmentDuration > segmentLength;

    // this is stupid, but gets one case fixed...
    const x = silence + segmentLength - silence % segmentLength;
    const nextCueIsInNextSegment = silence <= segmentLength ||
                                   x + totalSegmentsDuration < nextStart;

    // if we're at the segment length or we just have one segment, drain cues
    // TODO reduce nesting here
    if (nextCueIsInNextSegment && (
          currentSegmentDuration >= segmentLength ||
          lastCue ||
          nextIsInNewSegment)) {

      let duration = segmentLength;
      debug(`Duration #1 = ${duration}`);

      if (firstCue) {
        duration = end - (end % segmentLength);

        if (start <= segmentLength) {
          duration = segmentLength;
        }
      }

      if (!(firstCue || lastCue)) {
        if (currentSegmentDuration > segmentLength) {
          const y = currentSegmentDuration - segmentLength;
          duration = alignToSegmentLength(y, segmentLength);
          debug(`Duration #2.1 = ${duration}`);
        }

        if (silence > segmentLength) {
          duration = alignToSegmentLength(silence, segmentLength);
          debug(`Duration #2.2 = ${duration}`);
        }

        // we're in the middle with more than segmentLength to the next one
        // compensate current duration accordingly
        if (nextStart - end >= segmentLength) {
          if (end - totalSegmentsDuration < segmentLength) {
            duration = end - totalSegmentsDuration;
            debug(`Duration #3.1 = ${duration}`);
            duration = segmentLength;
          } else {
            duration = end - totalSegmentsDuration + segmentLength - cueLength;
            debug(`Duration #3.2 = ${duration}`);
          }
        }
      }

      // make sure the last cue covers the whole time of the cues
      if (lastCue) {
        duration = end - totalSegmentsDuration;
        duration = parseFloat(duration.toFixed(2));
      } else {
        duration = Math.round(duration);
      }

      debug(`Duration Final = ${duration}`);

      segments.push({ duration, cues });
      cues = [];

      totalSegmentsDuration += duration;
      currentSegmentDuration = 0;
    }

    if (queuedCue) {
      queuedCue = null;
    }

    if (shouldQueue) {
      debug('Queueing cue');
      queuedCue = cue;
    }
  });

  return segments;
}

function alignToSegmentLength (n, segmentLength) {
  n += segmentLength - n % segmentLength;
  return n;
}

const debugging = false;
function debug (m) {
  if (debugging) {
    console.log(m);
  }
}

module.exports = { segment };
