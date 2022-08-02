"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultParserOptions = exports.EndsBeforeStarts = exports.InvalidCueTimestamp = exports.IdentifierNoTimestamp = exports.StandaloneCue = exports.MalformedSignature = exports.InvalidHeaderComment = exports.InvalidStart = exports.InvalidCueOrder = exports.InvalidInput = exports.ParserError = exports.CompilerError = void 0;
// Error Classes
var CompilerError = /** @class */ (function (_super) {
    __extends(CompilerError, _super);
    function CompilerError(message) {
        var _this = _super.call(this, message) || this;
        Object.setPrototypeOf(_this, CompilerError.prototype);
        return _this;
    }
    return CompilerError;
}(Error));
exports.CompilerError = CompilerError;
var ParserError = /** @class */ (function (_super) {
    __extends(ParserError, _super);
    function ParserError(message) {
        var _this = _super.call(this, message) || this;
        Object.setPrototypeOf(_this, ParserError.prototype);
        return _this;
    }
    return ParserError;
}(Error));
exports.ParserError = ParserError;
// Error Messages
exports.InvalidInput = 'Input must be valid';
var InvalidCueOrder = function (index) { return "Cues must be in chronological order (cue #".concat(index, ")"); };
exports.InvalidCueOrder = InvalidCueOrder;
var InvalidStart = function (index) { return "Invalid start time (NaN) (cue #".concat(index, ")"); };
exports.InvalidStart = InvalidStart;
exports.InvalidHeaderComment = 'Header comment must start with a space or tab';
exports.MalformedSignature = 'Missing blank line after signature';
var StandaloneCue = function (index) { return "Cue identifier cannot be standalone (cue #".concat(index, ")"); };
exports.StandaloneCue = StandaloneCue;
var IdentifierNoTimestamp = function (index) { return "Cue identifier needs to be followed by timestamp (cue #".concat(index, ")"); };
exports.IdentifierNoTimestamp = IdentifierNoTimestamp;
var InvalidCueTimestamp = function (index) { return "Invalid cue timestamp (cue #".concat(index, ")"); };
exports.InvalidCueTimestamp = InvalidCueTimestamp;
var EndsBeforeStarts = function (index) { return "Cue cannot have end time less than or equal to start time (cue #".concat(index, ")"); };
exports.EndsBeforeStarts = EndsBeforeStarts;
exports.DefaultParserOptions = {
    meta: false,
    strict: true,
    processMeta: true,
    convertToMs: false,
};
