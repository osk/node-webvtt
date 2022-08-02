"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = __importDefault(require("commander"));
var fs_1 = require("fs");
var path_1 = __importDefault(require("path"));
var hls_1 = require("../lib/hls");
var ProgramCommander = commander_1.default
    .version("0.0.1")
    .usage("[options] <webvtt file>")
    .option("-t, --target-duration [duration]", "Target duration for each segment in seconds (default = 10)", parseInt, 10)
    .option("-o --output-directory [dir]", "Output directory for segments and playlist", "./")
    .option("-v, --verbose", "Chatty output")
    .option("-s, --silent", "No output")
    .option("-p, --playlist-filename [filename]", 'Name for generated m3u8 playlist (default = "playlist.m3u8")', "playlist.m3u8")
    .parse(process.argv).program;
var ProgramOptions = ProgramCommander.opts();
var ProgramInput = ProgramCommander.args;
function welcome(outputDir, targetDuration) {
    log("Hi there! Let’s try and parse and segment a webvtt file, shall we");
    log("Output directory is: ".concat(outputDir));
    log("Target duration is: ".concat(targetDuration));
}
function validateInput(input) {
    if (input.length > 1) {
        fail("Too many inputs. Only supports one file");
    }
    if (input.length === 0) {
        fail("No input received");
    }
    return input[0];
}
function read(targetFile) {
    try {
        log("Trying to read \"".concat(targetFile, "\""));
        var stats = (0, fs_1.statSync)(targetFile);
        if (!stats.isFile()) {
            fail("\"".concat(targetFile, "\" is not a file"));
        }
        log("\"".concat(targetFile, "\" is a file, reading and assuming UTF-8"));
        var data = (0, fs_1.readFileSync)(targetFile, "utf-8");
        data = data.replace(/^\uFEFF/, "");
        return data;
    }
    catch (error) {
        fail("There was an error reading ".concat(targetFile), error);
        throw error;
    }
}
function log(message) {
    if (ProgramOptions["verbose"] && !ProgramOptions["silent"]) {
        console.log(message);
    }
}
function fail(message, error) {
    if (!ProgramOptions["silent"]) {
        console.log(message);
    }
    if (error) {
        console.error("Exception: ".concat(error.stack));
    }
    process.exit(1);
}
function writePlaylist(fileContent, targetDuration, outputDir, playlistFilename) {
    var playlist = (0, hls_1.hlsSegmentPlaylist)(fileContent, targetDuration);
    var outputFileTarget = path_1.default.join(outputDir, playlistFilename);
    log("Writing ".concat(playlist.length, " bytes (utf-8) to: ").concat(outputFileTarget));
    (0, fs_1.writeFileSync)(outputFileTarget, playlist, "utf-8");
}
function writeSegments(fileContent, targetDuration, outputDir) {
    var segments = (0, hls_1.hlsSegment)(fileContent, targetDuration);
    var numSegments = segments.length;
    var writeEllipsis = true;
    log("Writing ".concat(numSegments, " segments..."));
    segments.forEach(function (segment, index) {
        var outputFileTarget = path_1.default.join(outputDir, segment.filename);
        try {
            (0, fs_1.writeFileSync)(outputFileTarget, segment.content, "utf-8");
        }
        catch (error) {
            fail("Failed writing ".concat(segment.filename, ". Wrote ").concat(index + 1, " segments. Exiting..."), error);
        }
        var printRange = 5;
        if (index < printRange ||
            (numSegments - printRange <= index && index < numSegments)) {
            log("Wrote segment ".concat(index + 1, " to ").concat(outputFileTarget));
        }
        else {
            if (writeEllipsis) {
                log("...");
                writeEllipsis = false;
            }
        }
    });
    log("Finished writing segments");
}
function webvttSegment() {
    var file = validateInput(ProgramInput);
    var outputDir = ProgramOptions["outputDirectory"];
    var targetDuration = ProgramOptions["targetDuration"];
    var playlistFilename = ProgramOptions["playlistFilename"];
    welcome(outputDir, targetDuration);
    var fileContent = read(file);
    writePlaylist(fileContent, targetDuration, outputDir, playlistFilename);
    writeSegments(fileContent, targetDuration, outputDir);
}
webvttSegment();
