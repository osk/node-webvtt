import { convertTimestamp } from "./time-convert";
import {
  CompilerError,
  InvalidInput,
  VTT,
  InvalidCueOrder,
  Cue,
  InvalidStart,
  EndsBeforeStarts,
} from "./types";

function compileCue(cue: Cue): string {
  let cueAsString = cue.identifier ? `${cue.identifier}\n` : "";

  cueAsString += `${convertTimestamp(cue.start)} --> ${convertTimestamp(
    cue.end
  )}`;
  cueAsString += cue.styles ? ` ${cue.styles}\n` : "\n";
  cueAsString += cue.text;

  return cueAsString;
}

export function compile(input: VTT): string {
  if (!input.valid) {
    throw new CompilerError(InvalidInput);
  }

  let output = "WEBVTT\n";
  if (input.meta) {
    for (const key in input.meta) {
      output += `${key}: ${input.meta[key]}\n`;
    }
  }

  let previousTime = -1;
  input.cues?.forEach((cue, index) => {
    if (isNaN(cue.start)) {
      throw new CompilerError(InvalidStart(index));
    } else if (cue.start < previousTime) {
      throw new CompilerError(InvalidCueOrder(index));
    } else if (cue.end <= cue.start) {
      throw new CompilerError(EndsBeforeStarts(index));
    }
    previousTime = cue.start;

    output += `\n${compileCue(cue)}\n`;
  });

  return output;
}
