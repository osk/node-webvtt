# WebVTT compiler parser and segmenter

Compiles, parses WebVTT files, segments and generates HLS playlists for them.

[![CircleCI](https://circleci.com/gh/osk/node-webvtt.svg?style=svg)](https://circleci.com/gh/osk/node-webvtt)

## Usage

For a WebVTT file:

```
WEBVTT

00:00:00.000 --> 00:00:01.000
Hello world!

00:00:30.000 --> 00:00:31.000 align:start line:0%
This is a subtitle

00:01:00.000 --> 00:01:01.000
Foo

00:01:50.000 --> 00:01:51.000
Bar
```

We can parse, segment and create HLS playlists, and compile back to WebVTT format:

```javascript
const webvtt = require('node-webvtt');

const segmentDuration = 10; // default to 10
const startOffset = 0; // Starting MPEG TS offset to be used in timestamp map, default 900000

const parsed = webvtt.parse(input);
const compile = webvtt.compile(input);
const segmented = webvtt.parse(input, segmentDuration);
const playlist = webvtt.hls.hlsSegmentPlaylist(input, segmentDuration);
const segments = webvtt.hls.hlsSegment(input, segmentDuration, startOffset);
```

### Parsing

Parses the WebVTT file and returns an object with `valid === true` if parsed correctly and an array of cues parsed.

Each cue can have:
* `identifier` - Id, if any of the cue
* `start` - Start time of cue in seconds
* `end` - End time of cue in seconds
* `text` - Text of the subtitle
* `styles` - If any of the cue

If the WebVTT file is invalid, the parser will throw a `ParserError` exception. So for safety, calls to `parse` should be in `try catch`.

For the above example we'd get:

```json
{
   "valid":true,
   "cues":[
      {
         "identifier":"",
         "start":0,
         "end":1,
         "text":"Hello world!",
         "styles":""
      },
      {
         "identifier":"",
         "start":30,
         "end":31,
         "text":"This is a subtitle",
         "styles":"align:start line:0%"
      },
      {
         "identifier":"",
         "start":60,
         "end":61,
         "text":"Foo",
         "styles":""
      },
      {
         "identifier":"",
         "start":110,
         "end":111,
         "text":"Bar",
         "styles":""
      }
   ]
}
```

### Metadata

Some WebVTT strings may also contain lines of metadata after the initial `WEBVTT` line, for example:

```
WEBVTT
Kind: captions
Language: en

00:00:00.000 --> 00:00:01.000
Hello world!
```

By passing `{ meta: true }` to the `parse` method, these metadata will be returned as an object called `meta`. For example, parsing the above example:

```js
parse(webvtt, { meta: true });
```

would return the following:

```json
{
   "valid":true,
   "meta":{
      "Kind": "captions",
      "Language": "en"
   },
   "cues":[
      {
         "identifier":"",
         "start":0,
         "end":1,
         "text":"Hello world!",
         "styles":""
      }
   ]
}
```

If no metadata is available, `meta` will be set to `null` in the result if the option is specified.

### Compiling

Compiles JSON from the above format back into a WebVTT string.

If the object is missing any attributes, the compiler will throw a `CompilerError` exception. So
for safety, calls to `compile` should be in `try catch`.

### Segmenting

Segments a subtitle according to how it should be segmented for HLS subtitles.

* Does a one pass of the cues for segmenting, this might have been a good idea or bad, only time will tell
* The One and Only Source of Truth is Apple's `mediasubtitlesegmenter` CLI

For the above example:

```javascript
[
    { duration: 10, cues: [ [Object] ] },
    { duration: 30, cues: [ [Object] ] },
    { duration: 30, cues: [ [Object] ] },
    { duration: 41, cues: [ [Object] ] }
]
```

### HLS playlist

Creates a subtitle playlist. For the above:

```
#EXTM3U
#EXT-X-TARGETDURATION:41
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:10.00000,
0.vtt
#EXTINF:30.00000,
1.vtt
#EXTINF:30.00000,
2.vtt
#EXTINF:41.00000,
3.vtt
#EXT-X-ENDLIST
```

### HLS Segments

Creates a list of HLS segments for the subtitles, returning an array of them with `filename` and `content`.

```json
[
   {
      "filename":"0.vtt",
      "content":"WEBVTT\nX-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000\n\n00:00:00.000 --> 00:00:01.000\nHello world!\n"
   },
   {
      "filename":"1.vtt",
      "content":"WEBVTT\nX-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000\n\n00:00:30.000 --> 00:00:31.000 align:start line:0%\nThis is a subtitle\n"
   },
   {
      "filename":"2.vtt",
      "content":"WEBVTT\nX-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000\n\n00:01:00.000 --> 00:01:01.000\nFoo\n"
   },
   {
      "filename":"3.vtt",
      "content":"WEBVTT\nX-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000\n\n00:01:50.000 --> 00:01:51.000\nBar\n"
   }
]
```

## CLI

For segmenting a WebVTT file quickly, you can use the included CLI tool:

```
$ ./webvtt-segment.js -v --target-duration 10 -o ./subs subs.vtt
```

```
% ./webvtt-segment.js --help

  Usage: webvtt-segment [options] <webvtt file>

  Options:

    -h, --help                        output usage information
    -V, --version                     output the version number
    -t, --target-duration [duration]  Target duration for each segment in secods, defaults to 10
    -o, --output-directory [dir]      Output directory for segments and playlist
    -v, --verbose                     Chatty output
    -s, --silent                      No output
```

## Development

This has been written with TDD so we've got a good coverage of the features.

```
npm install
npm test
mocha -w
<write failing test>
<write passing code>
<lather, rinse, repeat>
```

## TODO

- [ ] Remove `valid` from parsing result, having a result means it's valid
- [ ] Add more options to control output
- [ ] Better parsing
- [ ] Support more subtitles formats (at least SRT, maybe SSA/ASS)
- [ ] Iron out segmenting bugs with real playlists
- [ ] Refactor the mess that is the segmenter (yay, unit tests!)
- [ ] Nicer interface, don't be parsing again and again
- [ ] Do something to make the cli tool more accessible
- [ ] Code coverage reporting

## References

* Anne van Kesteren's [WebVTT validator](https://github.com/annevk/webvtt)
    - [Live validator](https://quuz.org/webvtt/)
* [WebVTT Ruby parser and segmenter](https://github.com/opencoconut/webvtt-ruby)
* `mediasubtitlesegmenter` from Apple
* [WebVTT: The Web Video Text Tracks Format](https://w3c.github.io/webvtt/)
