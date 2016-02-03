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
    const cueLength = firstCue ? end : end - start;

    debug('------------');
    debug(`Cue #${i}`);

    currentSegmentDuration = currentSegmentDuration + cueLength;
    const silence = firstCue ? 0 : (start - parsed.cues[i - 1].end );
    currentSegmentDuration += silence;

    debug(`Start ${start}`);
    debug(`End ${end}`);
    debug(`Length ${cueLength}`);
    debug(`Total segment duration = ${totalSegmentsDuration}`);
    debug(`Current segment duration = ${currentSegmentDuration}`);

    // if there's a boundary cue queued, push and clear queue
    // don't clear it until end of loop since we need to look at it
    if (queuedCue) {
      cues.push(queuedCue);
      currentSegmentDuration += queuedCue.end - totalSegmentsDuration
    }

    cues.push(cue);

    // look ahead to know if we should wait for it or segment right away
    const nextIsFarAway = !lastCue &&
                          (parsed.cues[i + 1].start - end >= segmentLength);

    const rest = end - (totalSegmentsDuration + currentSegmentDuration);

    // if a cue passes a segment boundary, it appears in both
    // since we might have a queued cue, mark that we should queue and do at end
    let shouldQueue = !nextIsFarAway &&
                      silence < segmentLength &&
                        (currentSegmentDuration > segmentLength ||
                        (!lastCue && rest > 0));

    if (shouldQueue) {
      // wat
      if (end - totalSegmentsDuration < segmentLength) {
        shouldQueue = false;
      }
    }

    let nextIsInNewSegment = false;
    if (!lastCue) {
      const nextStart = parsed.cues[i + 1].start;
      const nextEnd = parsed.cues[i + 1].end;
      const nextLength = parsed.cues[i + 1].end - nextStart;
      const segmentLengthAfterNext = nextLength + currentSegmentDuration;
      debug(`Segment length after next = ${segmentLengthAfterNext}`);
      nextIsInNewSegment =  segmentLengthAfterNext > segmentLength && !firstCue;

      debug(`Start of next = ${nextStart}`);
      // but is the start in the current segment?

      if (nextStart - totalSegmentsDuration < segmentLength) {
        nextIsInNewSegment = false;
      }
    }

    // if we're at the segment length or we just have one segment, drain cues
    // TODO reduce nesting here
    if (currentSegmentDuration >= segmentLength ||
        parsed.cues.length === 1 ||
        nextIsFarAway ||
        lastCue ||
        nextIsInNewSegment) {

      let duration = segmentLength;
      debug(`Duration #1 = ${duration}`);

      if (!(firstCue || lastCue) &&
          currentSegmentDuration > segmentLength) {
        duration = segmentLength;
        debug(`Duration #2 = ${duration}`);

        if (silence > segmentLength) {
          duration += silence-segmentLength;
        }
      }

      // we're in the middle with more than segmentLength to the next one
      // compensate current duration accordingly
      if (!(firstCue || lastCue) &&
          nextIsFarAway) {
        if (end - totalSegmentsDuration < segmentLength) {
          duration = end - totalSegmentsDuration;
          debug(`Duration #3.1 = ${duration}`);
          duration = segmentLength
        } else {
          duration = end - totalSegmentsDuration + segmentLength - cueLength;
          debug(`Duration #3.2 = ${duration}`);
        }
        
      }

      // if we've inserted a queued cue before, add the rest from its end
      // to the current segments duration
      if (queuedCue) {
        duration = duration + queuedCue.end % segmentLength;
        debug(`Duration #4 = ${duration}`);
        if (duration > segmentLength) {
          duration = segmentLength;
          debug(`Duration #4.5 = ${duration}`);
        }
      }

      if (firstCue) {
        duration = end - (end % segmentLength);
      }

      // for the first cue, it should never pass one segment if its not shown
      // that long
      if (firstCue &&
          start <= segmentLength) {
        duration = segmentLength;
        debug(`Duration #5 = ${duration}`);
      }

      // if >2 segments, push length of rest into last segment
      if (lastCue &&
          end > (segments.length + 1) * segmentLength &&
          (segments.length > 1 || queuedCue)) {

        if (!queuedCue || !(queuedCue.end - queuedCue.start < segmentLength)) {
          duration = segmentLength + end % segmentLength;
          debug(`Duration #6 = ${duration}`);
        }
      }

      // make sure the last cue covers the whole time of the cues
      if (lastCue && totalSegmentsDuration < end) {
        duration = end - totalSegmentsDuration;
        debug(`Duration #7 = ${duration}`);
      }

      if (!lastCue) {
        duration = Math.round(duration);
      } else {
        duration = parseFloat(duration.toFixed(2));
      }
      debug(`Duration Final = ${duration}`);

      segments.push({ duration, cues });
      cues = [];

      totalSegmentsDuration += duration;
      currentSegmentDuration = 0;
    } else {
      // TODO this is a hack, but it's because of if hell above
      shouldQueue = false;
    }

    if (queuedCue) {
      queuedCue = null;
    }

    if (shouldQueue) {
      queuedCue = cue;
    }
  });

  return segments;
}

const debugging = false;
function debug (m) {
  if (debugging) {
    console.log(m);
  }
}

module.exports = { segment };
