'use strict';

const chai = require('chai');
chai.should();

const hls = require('../lib/hls');

describe('WebVTT HLS segmenter', () => {
  it('should generate playlist for a simple subtitles file', () => {
    const input = `WEBVTT

00:00.000 --> 00:10.000
a

00:10.000 --> 00:20.000
a`;
    const expectedPlaylist = `#EXTM3U
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
    const generated = hls.hlsSegmentPlaylist(input, 10);

    generated.should.equal(expectedPlaylist);
  });

  it('should generate segments for a simple subtitles file', () => {
    const input = `WEBVTT

1
01:01:01.800 --> 01:12:19.999 align:start line:0%
a

2
05:59:59.000 --> 05:59:59.999
b`;
    const expectedFirstSegment = `WEBVTT
X-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000

1
01:01:01.800 --> 01:12:19.999 align:start line:0%
a
`;

    const expectedSecondSegment = `WEBVTT
X-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000

2
05:59:59.000 --> 05:59:59.999 
b
`;

    const generated = hls.hlsSegment(input, 3);

    generated[0].filename.should.equal('0.vtt');
    generated[0].content.should.equal(expectedFirstSegment);
    generated[1].filename.should.equal('1.vtt');
    generated[1].content.should.equal(expectedSecondSegment);
  });
});
