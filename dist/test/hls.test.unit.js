"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var hls_1 = require("../lib/hls");
var SimpleInput = "WEBVTT\n\n00:00.000 --> 00:10.000\na\n\n00:10.000 --> 00:20.000\na";
var SimpleHls = "#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXT-X-VERSION:3\n#EXT-X-MEDIA-SEQUENCE:0\n#EXT-X-PLAYLIST-TYPE:VOD\n#EXTINF:10.00000,\n0.vtt\n#EXTINF:10.00000,\n1.vtt\n#EXT-X-ENDLIST\n";
describe("HLS", function () {
    it("should generate a playlist for a simple subtitle file", function () {
        var generatedHls = (0, hls_1.hlsSegmentPlaylist)(SimpleInput, 10);
        expect(generatedHls).toBe(SimpleHls);
    });
});
