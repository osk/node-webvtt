import { hlsSegmentPlaylist } from "../lib/hls";

const SimpleInput = `WEBVTT

00:00.000 --> 00:10.000
a

00:10.000 --> 00:20.000
a`;

const SimpleHls = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:10.00000,
0.vtt
#EXTINF:10.00000,
1.vtt
#EXT-X-ENDLIST
`;

describe("HLS", () => {
  it("should generate a playlist for a simple subtitle file", () => {
    const generatedHls = hlsSegmentPlaylist(SimpleInput, 10);
    expect(generatedHls).toBe(SimpleHls);
  });
});
