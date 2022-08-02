import {
  DefaultParserOptions,
  HeaderMeta,
  Cue,
  ParsedCues,
  VTT,
  ParserError,
  ParserOptions,
  InvalidHeaderComment,
  MalformedSignature,
  StandaloneCue,
  IdentifierNoTimestamp,
  InvalidCueTimestamp,
  EndsBeforeStarts,
} from "./types";

// eslint-disable-next-line @typescript-eslint/naming-convention
const TIMESTAMP_REGEXP = /(\d+)?:?(\d{2}):(\d{2}\.\d{2,3})/;

function ensureHeaderSeparation(header: string, input: string): string {
  // Ensures that there is a blank line (\n\n) after the WEBVTT header
  // and/or header comments.
  // First checks to see if there is a timestamp mark ('-->') in the header indicating
  // that a cue has not been given enough separation between the header and any extant
  // header metadata.
  // If a timestamp mark is found, the regular newline will be increased to a double
  // newline before it so that it will be separated off and parsed correctly as a cue.
  //
  // NOTE: This approach will strip any cue identifiers that are attached to the cue
  // however in the current vtt -> tts workflow we are ignoring cue identifiers at the
  // moment. This may be an issue in the future if we need cue identifiers to select
  // appropriate tts voicings.
  const fixedHeader = header.split("\n").reduce((acc, headerLine) => {
    return [acc, headerLine].join(headerLine.includes("-->") ? "\n\n" : "\n");
  }, "");
  const cues = input.split("\n\n").slice(1);
  return `${fixedHeader.trim()}\n\n${cues}`;
}

function preprocessInput(inputRaw: string): string {
  // convert all newlines to \n
  const input = inputRaw.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // add WEBVTT header to file if not present
  if (!input.startsWith("WEBVTT")) {
    // if the first section (without WEBVTT) includes the time separation mark, then it is the
    // first cue and must have a blank line between itself and the WEBVTT header. Otherwise,
    // this is likely header metadata at the top of the file which is missing the WEBVTT tag
    // and should not take a full blank line in the middle, rather a tab space separator
    return input.split("\n\n")[0].includes("-->")
      ? `WEBVTT\n\n${input}`
      : `WEBVTT\n${input}`;
  }

  // ensure header is separated from first cue
  const header = input.split("\n\n")[0];
  if (header.includes("-->")) {
    return ensureHeaderSeparation(header, input);
  }

  return input;
}

export function parse(inputRaw: string, options?: ParserOptions): VTT {
  const { meta, strict, processMeta, convertToMs } =
    options ?? DefaultParserOptions;

  const input = preprocessInput(inputRaw);

  const parts = input.split("\n\n");
  const header = parts.shift();

  if (!header) {
    return { valid: false, strict };
  }

  const headerParts = header.split("\n");

  const headerComments = headerParts[0].replace("WEBVTT", "");

  if (
    headerComments.length > 0 &&
    headerComments[0] !== " " &&
    headerComments[0] !== "\t"
  ) {
    throw new ParserError(InvalidHeaderComment);
  }

  // no cues in VTT file
  if (parts.length === 0 && headerParts.length === 1) {
    return { valid: true, strict, cues: [], errors: [] };
  }

  if (!meta && processMeta && headerParts.length > 1 && headerParts[1] !== "") {
    throw new ParserError(MalformedSignature);
  }

  const { cues, errors } = parseCues(parts, strict, convertToMs);

  if (strict && errors.length > 0) {
    throw errors[0];
  }

  const headerMeta = meta && processMeta ? parseMeta(headerParts) : undefined;

  const result: VTT = { valid: errors.length === 0, strict, cues, errors };

  if (meta) {
    result.meta = headerMeta;
  }

  return result;
}

function parseMeta(headerParts: Array<string>) {
  const meta: HeaderMeta = {};
  headerParts.slice(1).forEach((header) => {
    const splitIdx = header.indexOf(":");
    const key = header.slice(0, splitIdx).trim();
    const value = header.slice(splitIdx + 1).trim();
    meta[key] = value;
  });
  return Object.keys(meta).length > 0 ? meta : undefined;
}

function parseCues(
  cues: Array<string>,
  strict: boolean,
  convertToMs: boolean
): ParsedCues {
  const errors: Array<ParserError> = [];

  const parsedCues: Array<Cue> = cues
    .map((cue, i) => {
      try {
        return parseCue(cue, i, strict, convertToMs);
      } catch (e) {
        errors.push(e as ParserError);
        return undefined;
      }
    })
    .filter(Boolean) as Array<Cue>;

  return {
    cues: parsedCues,
    errors,
  };
}

function parseCue(
  cue: string,
  i: number,
  strict: boolean,
  convertToMs: boolean
): Cue | undefined {
  let identifier: string = "";
  let start: number = 0;
  let end = 0.01;
  let text = "";
  let styles = "";

  // split and remove empty lines
  const lines = cue.split("\n").filter(Boolean);

  if (lines.length > 0 && lines[0].trim().startsWith("NOTE")) {
    return undefined;
  }

  if (lines.length === 1 && !lines[0].includes("-->")) {
    throw new ParserError(StandaloneCue(i));
  }

  if (
    lines.length > 1 &&
    !(lines[0].includes("-->") || lines[1].includes("-->"))
  ) {
    throw new ParserError(IdentifierNoTimestamp(i));
  }

  if (lines.length > 1 && lines[1].includes("-->")) {
    identifier = lines.shift() ?? "";
  }

  const times = typeof lines[0] === "string" ? lines[0].split(" --> ") : [];

  if (
    times.length !== 2 ||
    !validTimestamp(times[0]) ||
    !validTimestamp(times[1])
  ) {
    throw new ParserError(InvalidCueTimestamp(i));
  }

  start = parseTimestamp(times[0]) / (convertToMs ? 1000 : 1);
  end = parseTimestamp(times[1]) / (convertToMs ? 100 : 1);

  if (strict) {
    if (start > end) {
      throw new ParserError(EndsBeforeStarts(i));
    }

    if (end <= start) {
      throw new ParserError(EndsBeforeStarts(i));
    }
  }

  if (!strict && end < start) {
    throw new ParserError(
      `End must be greater or equal to start when not strict (cue #${i})`
    );
  }

  // TODO better style validation
  styles = times[1].replace(TIMESTAMP_REGEXP, "").trim();

  lines.shift();

  text = lines.join("\n");

  if (!text) {
    return undefined;
  }

  return { identifier, start, end, text, styles };
}

function validTimestamp(timestamp: string) {
  return TIMESTAMP_REGEXP.test(timestamp);
}

function parseTimestamp(timestamp: string): number {
  const matches = timestamp.match(TIMESTAMP_REGEXP);
  if (matches) {
    let secs = (matches[1] ? Number.parseFloat(matches[1]) : 0) * 60 * 60; // hours
    secs += Number.parseFloat(matches[2]) * 60; // mins
    secs += Number.parseFloat(matches[3]); // seconds.milliseconds
    return Number(secs.toFixed(3));
  }
  return 0;
}
