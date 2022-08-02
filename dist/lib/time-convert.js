"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printableTimestamp = exports.convertTimestamp = void 0;
function convertTimestamp(time) {
    var hours = pad(calculateHours(time), 2);
    var minutes = pad(calculateMinutes(time), 2);
    var seconds = pad(calculateSeconds(time), 2);
    var milliseconds = pad(calculateMs(time), 3);
    return "".concat(hours, ":").concat(minutes, ":").concat(seconds, ".").concat(milliseconds);
}
exports.convertTimestamp = convertTimestamp;
function printableTimestamp(timestamp) {
    var ms = Number((timestamp % 1).toFixed(3));
    timestamp = Math.round(timestamp - ms);
    var hours = Math.floor(timestamp / 3600);
    var mins = Math.floor((timestamp - hours * 3600) / 60);
    var secs = timestamp - hours * 3600 - mins * 60;
    // TODO hours aren't required by spec, but we include them, should be config
    var hourString = "".concat(pad(hours, 2), ":");
    return "".concat(hourString).concat(pad(mins, 2), ":").concat(pad(secs, 2), ".").concat(pad(ms * 1000, 3));
}
exports.printableTimestamp = printableTimestamp;
function pad(num, zeroes) {
    var output = "".concat(num);
    while (output.length < zeroes) {
        output = "0".concat(output);
    }
    return output;
}
function calculateHours(time) {
    return Math.floor(time / 60 / 60);
}
function calculateMinutes(time) {
    return Math.floor(time / 60) % 60;
}
function calculateSeconds(time) {
    return Math.floor(time % 60);
}
function calculateMs(time) {
    return Math.floor(Number((time % 1).toFixed(4)) * 1000);
}
