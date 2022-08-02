"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("./types");
// eslint-disable-next-line @typescript-eslint/naming-convention
var TIMESTAMP_REGEXP = /(\d+)?:?(\d{2}):(\d{2}\.\d{2,3})/;
function ensureHeaderSeparation(header, input) {
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
    var fixedHeader = header.split("\n").reduce(function (acc, headerLine) {
        return [acc, headerLine].join(headerLine.includes("-->") ? "\n\n" : "\n");
    }, "");
    var cues = input.split("\n\n").slice(1);
    return "".concat(fixedHeader.trim(), "\n\n").concat(cues);
}
function preprocessInput(inputRaw) {
    // convert all newlines to \n
    var input = inputRaw.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    // add WEBVTT header to file if not present
    if (!input.startsWith("WEBVTT")) {
        // if the first section (without WEBVTT) includes the time separation mark, then it is the
        // first cue and must have a blank line between itself and the WEBVTT header. Otherwise,
        // this is likely header metadata at the top of the file which is missing the WEBVTT tag
        // and should not take a full blank line in the middle, rather a tab space separator
        return input.split("\n\n")[0].includes("-->")
            ? "WEBVTT\n\n".concat(input)
            : "WEBVTT\n".concat(input);
    }
    // ensure header is separated from first cue
    var header = input.split("\n\n")[0];
    if (header.includes("-->")) {
        return ensureHeaderSeparation(header, input);
    }
    return input;
}
function parse(inputRaw, options) {
    var _a = options !== null && options !== void 0 ? options : types_1.DefaultParserOptions, meta = _a.meta, strict = _a.strict, processMeta = _a.processMeta, convertToMs = _a.convertToMs;
    var input = preprocessInput(inputRaw);
    var parts = input.split("\n\n");
    var header = parts.shift();
    if (!header) {
        return { valid: false, strict: strict };
    }
    var headerParts = header.split("\n");
    var headerComments = headerParts[0].replace("WEBVTT", "");
    if (headerComments.length > 0 &&
        headerComments[0] !== " " &&
        headerComments[0] !== "\t") {
        throw new types_1.ParserError(types_1.InvalidHeaderComment);
    }
    // no cues in VTT file
    if (parts.length === 0 && headerParts.length === 1) {
        return { valid: true, strict: strict, cues: [], errors: [] };
    }
    if (!meta && processMeta && headerParts.length > 1 && headerParts[1] !== "") {
        throw new types_1.ParserError(types_1.MalformedSignature);
    }
    var _b = parseCues(parts, strict, convertToMs), cues = _b.cues, errors = _b.errors;
    if (strict && errors.length > 0) {
        throw errors[0];
    }
    var headerMeta = meta && processMeta ? parseMeta(headerParts) : undefined;
    var result = { valid: errors.length === 0, strict: strict, cues: cues, errors: errors };
    if (meta) {
        result.meta = headerMeta;
    }
    return result;
}
exports.default = parse;
function parseMeta(headerParts) {
    var meta = {};
    headerParts.slice(1).forEach(function (header) {
        var splitIdx = header.indexOf(":");
        var key = header.slice(0, splitIdx).trim();
        var value = header.slice(splitIdx + 1).trim();
        meta[key] = value;
    });
    return Object.keys(meta).length > 0 ? meta : undefined;
}
function parseCues(cues, strict, convertToMs) {
    var errors = [];
    var parsedCues = cues
        .map(function (cue, i) {
        try {
            return parseCue(cue, i, strict, convertToMs);
        }
        catch (e) {
            errors.push(e);
            return undefined;
        }
    })
        .filter(Boolean);
    return {
        cues: parsedCues,
        errors: errors,
    };
}
function parseCue(cue, i, strict, convertToMs) {
    var _a;
    var identifier = "";
    var start = 0;
    var end = 0.01;
    var text = "";
    var styles = "";
    // split and remove empty lines
    var lines = cue.split("\n").filter(Boolean);
    if (lines.length > 0 && lines[0].trim().startsWith("NOTE")) {
        return undefined;
    }
    if (lines.length === 1 && !lines[0].includes("-->")) {
        throw new types_1.ParserError((0, types_1.StandaloneCue)(i));
    }
    if (lines.length > 1 &&
        !(lines[0].includes("-->") || lines[1].includes("-->"))) {
        throw new types_1.ParserError((0, types_1.IdentifierNoTimestamp)(i));
    }
    if (lines.length > 1 && lines[1].includes("-->")) {
        identifier = (_a = lines.shift()) !== null && _a !== void 0 ? _a : "";
    }
    var times = typeof lines[0] === "string" ? lines[0].split(" --> ") : [];
    if (times.length !== 2 ||
        !validTimestamp(times[0]) ||
        !validTimestamp(times[1])) {
        throw new types_1.ParserError((0, types_1.InvalidCueTimestamp)(i));
    }
    start = parseTimestamp(times[0]) / (convertToMs ? 1000 : 1);
    end = parseTimestamp(times[1]) / (convertToMs ? 100 : 1);
    if (strict) {
        if (start > end) {
            throw new types_1.ParserError((0, types_1.EndsBeforeStarts)(i));
        }
        if (end <= start) {
            throw new types_1.ParserError((0, types_1.EndsBeforeStarts)(i));
        }
    }
    if (!strict && end < start) {
        throw new types_1.ParserError("End must be greater or equal to start when not strict (cue #".concat(i, ")"));
    }
    // TODO better style validation
    styles = times[1].replace(TIMESTAMP_REGEXP, "").trim();
    lines.shift();
    text = lines.join("\n");
    if (!text) {
        return undefined;
    }
    return { identifier: identifier, start: start, end: end, text: text, styles: styles };
}
function validTimestamp(timestamp) {
    return TIMESTAMP_REGEXP.test(timestamp);
}
function parseTimestamp(timestamp) {
    var matches = timestamp.match(TIMESTAMP_REGEXP);
    if (matches) {
        var secs = (matches[1] ? Number.parseFloat(matches[1]) : 0) * 60 * 60; // hours
        secs += Number.parseFloat(matches[2]) * 60; // mins
        secs += Number.parseFloat(matches[3]); // seconds.milliseconds
        return Number(secs.toFixed(3));
    }
    return 0;
}
