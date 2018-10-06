'use strict';

/**
 * See spec: https://www.w3.org/TR/webvtt1/#file-structure
 */

function CompilerError (message, error) {
  this.message = message;
  this.error = error;
}
CompilerError.prototype = Object.create(Error.prototype);

function compiler (input) {

  if (typeof input !== 'object') {
    throw new CompilerError('Input must be a object');
  }

  if (!input.valid) {
    throw new CompilerError('Input must be valid');
  }


  let output = 'WEBVTT\n\n';

  input.cues.forEach((cue) => {
    output += compileCue(cue);
    output += '\n';
  });

  return output;
}

/**
 * Compile a single cue block.
 *
 * @param {array} cue Array of content for the cue
 *
 * @returns {object} cue Cue object with start, end, text and styles.
 *                       Null if it's a note
 */
function compileCue (cue) {
  // TODO: check for malformed JSON
  if (typeof cue.identifier === 'undefined') {
    throw new CompilerError(`Cue malformed: null identifier value.
    ${JSON.stringify(cue)}`);
  }
  if (typeof cue.start === 'undefined') {
    throw new CompilerError(`Cue malformed: null start value.
    ${JSON.stringify(cue)}`);
  }
  if (typeof cue.end === 'undefined') {
    throw new CompilerError(`Cue malformed: null end value.
    ${JSON.stringify(cue)}`);
  }
  if (typeof cue.text === 'undefined') {
    throw new CompilerError(`Cue malformed: null text value.
    ${JSON.stringify(cue)}`);
  }
  if (typeof cue.styles === 'undefined') {
    throw new CompilerError(`Cue malformed: null styles value.
    ${JSON.stringify(cue)}`);
  }
  if (cue.start >= cue.end) {
    throw new CompilerError(`Cue malformed: start timestamp greater than end
    ${JSON.stringify(cue)}`);
  }

  let output = '';
  if (cue.identifier.length > 0) {
    output += `${cue.identifier}\n`;
  }

  const startTimestamp = convertTimestamp(cue.start);
  const endTimestamp = convertTimestamp(cue.end);

  output += `${startTimestamp} --> ${endTimestamp} ${cue.styles}\n${cue.text}`;

  return output;
}

function convertTimestamp (time) {
  const hours = Math.floor(time / 60 / 60).toString();
  const minutes = pad((Math.floor(time / 60) % 60), 2);
  const seconds = pad(Math.floor((time) % 60), 2);
  const milliseconds = pad(Math.round((time % 1) * 1000), 3);
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function pad (number, zeroes) {
  let output = number;
  while (output.length < zeroes) {
    output = `0${ output }`;
  }
  return output;
}

module.exports = { CompilerError, compiler };
