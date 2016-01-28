'use strict';

const parse = require('./lib/parser').parse;
const segment = require('./lib/segmenter').segment;
const hls = require('./lib/hls');

module.exports = { parse, segment, hls };
