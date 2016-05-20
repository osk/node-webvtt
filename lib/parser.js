'use strict';

function ParserError (message, error) {
  this.message = message;
  this.error = error;
}
ParserError.prototype = Object.create(Error.prototype);

const TIMESTAMP_REGEXP = /([0-9]{2})?:?([0-9]{2}):([0-9]{2}\.[0-9]{3})/;
const TIME_SEGMENT_REGEXP = /((\d+:)?\d\d\:\d\d[.,]\d\d\d)/;
const CUE_HEADER_REGEXP = new RegExp(
  `${TIME_SEGMENT_REGEXP}\\s-->\\s${TIME_SEGMENT_REGEXP}(\s.*)?`);

function parse (input) {

  let i;

  if (typeof input !== 'string') {
    throw new ParserError('Input must be a string');
  }

  input = input.replace(/\r\n/g, '\n');
  input = input.replace(/\r/g, '\n');

  const parts = input.split('\n\n');

  const header = parts.shift();

  if (!header.startsWith('WEBVTT')) {
    throw new ParserError('Must start with "WEBVTT"');
  }

  const headerParts = header.split('\n');

  // nothing of interests, return early
  if (parts.length === 0 && headerParts.length === 1) {
    return { valid: true };
  }

  if (headerParts.length > 1 && headerParts[1] !== '') {
    throw new ParserError('No blank line after signature');
  }

  for (i = 0; i < parts.length; i++) {
    const lines = parts[i].trim().split('\n');
    if (lines.length > 0
      && (!CUE_HEADER_REGEXP.test(lines[0]) && !/\d+/.test(lines[0]))) {
      if (i > 0) {
        parts[i - 1] += `\n\n${parts[i]}`;
        parts.splice(i, 1);
        i--;
      }
    }
  }

  const cues = parseCues(parts);

  return { valid: true, cues };
}

function parseCues (cues) {
  return cues.map(parseCue);
}

function parseCue (cue, i) {
  let identifier = '';
  let start = 0;
  let end = 0;
  let text = '';
  let styles = '';

  // split and remove empty lines
  const lines = cue.split('\n').filter(Boolean);

  if (lines.length === 1 && !lines[0].includes('-->')) {
    throw new ParserError(`Cue identifier cannot be standalone (cue #${i})`);
  }

  if (lines.length > 1 &&
      !(lines[0].includes('-->') || lines[1].includes('-->'))) {
    const msg = `Cue identifier needs to be followed by timestamp (cue #${i})`;
    throw new ParserError(msg);
  }

  if (lines.length > 1 && lines[1].includes('-->')) {
    identifier = lines.shift();
  }

  if (lines.length > 0 && lines[0].includes('-->')) {
    const times = lines[0].split(' --> ');

    if (times.length !== 2 ||
        !validTimestamp(times[0]) ||
        !validTimestamp(times[1])) {
      throw new ParserError(`Invalid cue timestamp (cue #${i})`);
    }

    start = parseTimestamp(times[0]);
    end = parseTimestamp(times[1]);

    if (start > end) {
      throw new ParserError(`Start timestamp greater than end (cue #${i})`);
    }

    if (end <= start) {
      throw new ParserError(`End must be greater than start (cue #${i})`);
    }

    // TODO better style validation
    styles = times[1].replace(TIMESTAMP_REGEXP, '').trim();

    lines.shift();
  }

  text = lines.join('\n');

  return { identifier, start, end, text, styles };
}

function validTimestamp (timestamp) {
  return TIMESTAMP_REGEXP.test(timestamp);
}

function parseTimestamp (timestamp) {
  const matches = timestamp.match(TIMESTAMP_REGEXP);

  let secs = parseFloat(matches[3]);
  secs += parseFloat(matches[2]) * 60; // mins
  secs += parseFloat(matches[1] || 0) * 60 * 60; // hours
  return secs;
}

module.exports = { ParserError, parse };
