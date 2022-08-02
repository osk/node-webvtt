import program from "commander";
import { readFileSync, statSync, writeFileSync } from "fs";
import path from "path";
import { hlsSegment, hlsSegmentPlaylist } from "../lib/hls";

const ProgramCommander = program
  .version("0.0.1")
  .usage("[options] <webvtt file>")
  .option(
    "-t, --target-duration [duration]",
    "Target duration for each segment in seconds (default = 10)",
    parseInt,
    10
  )
  .option(
    "-o --output-directory [dir]",
    "Output directory for segments and playlist",
    "./"
  )
  .option("-v, --verbose", "Chatty output")
  .option("-s, --silent", "No output")
  .option(
    "-p, --playlist-filename [filename]",
    'Name for generated m3u8 playlist (default = "playlist.m3u8")',
    "playlist.m3u8"
  )
  .parse(process.argv).program;

const ProgramOptions = ProgramCommander.opts();
const ProgramInput = ProgramCommander.args;

function welcome(outputDir: string, targetDuration: number) {
  log("Hi there! Let’s try and parse and segment a webvtt file, shall we");
  log(`Output directory is: ${outputDir}`);
  log(`Target duration is: ${targetDuration}`);
}

function validateInput(input: Array<string>): string {
  if (input.length > 1) {
    fail("Too many inputs. Only supports one file");
  }

  if (input.length === 0) {
    fail("No input received");
  }

  return input[0];
}

function read(targetFile: string): string {
  try {
    log(`Trying to read "${targetFile}"`);
    const stats = statSync(targetFile);

    if (!stats.isFile()) {
      fail(`"${targetFile}" is not a file`);
    }

    log(`"${targetFile}" is a file, reading and assuming UTF-8`);
    let data = readFileSync(targetFile, "utf-8");

    data = data.replace(/^\uFEFF/, "");

    return data;
  } catch (error) {
    fail(`There was an error reading ${targetFile}`, error as Error);
    throw error;
  }
}

function log(message: string): void {
  if (ProgramOptions["verbose"] && !ProgramOptions["silent"]) {
    console.log(message);
  }
}

function fail(message: string, error?: Error): void {
  if (!ProgramOptions["silent"]) {
    console.log(message);
  }

  if (error) {
    console.error(`Exception: ${error.stack}`);
  }

  process.exit(1);
}

function writePlaylist(
  fileContent: string,
  targetDuration: number,
  outputDir: string,
  playlistFilename: string
): void {
  const playlist = hlsSegmentPlaylist(fileContent, targetDuration);
  const outputFileTarget = path.join(outputDir, playlistFilename);
  log(`Writing ${playlist.length} bytes (utf-8) to: ${outputFileTarget}`);
  writeFileSync(outputFileTarget, playlist, "utf-8");
}

function writeSegments(
  fileContent: string,
  targetDuration: number,
  outputDir: string
): void {
  const segments = hlsSegment(fileContent, targetDuration);

  const numSegments = segments.length;
  let writeEllipsis = true;
  log(`Writing ${numSegments} segments...`);
  segments.forEach((segment, index) => {
    const outputFileTarget = path.join(outputDir, segment.filename);

    try {
      writeFileSync(outputFileTarget, segment.content, "utf-8");
    } catch (error) {
      fail(
        `Failed writing ${segment.filename}. Wrote ${
          index + 1
        } segments. Exiting...`,
        error as Error
      );
    }

    const printRange = 5;
    if (
      index < printRange ||
      (numSegments - printRange <= index && index < numSegments)
    ) {
      log(`Wrote segment ${index + 1} to ${outputFileTarget}`);
    } else {
      if (writeEllipsis) {
        log("...");
        writeEllipsis = false;
      }
    }
  });
  log("Finished writing segments");
}

function webvttSegment(): void {
  const file = validateInput(ProgramInput);
  const outputDir = ProgramOptions["outputDirectory"];
  const targetDuration = ProgramOptions["targetDuration"];
  const playlistFilename = ProgramOptions["playlistFilename"];

  welcome(outputDir, targetDuration);

  const fileContent = read(file);

  writePlaylist(fileContent, targetDuration, outputDir, playlistFilename);
  writeSegments(fileContent, targetDuration, outputDir);
}

webvttSegment();
