var stream = require("stream");
var util = require("util");
var p = require("path");
var less = require("less");
var fs = require("fs");

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var through = require("through2");
var stream = require("stream");
var getValue = require("./common").getValue;
var clearNode = require("./common").clearNode;

function LessPlugin(outputName) {
    stream.Readable.call(this);
    var that = this;
    var lines = [];
    this.test = /.+\.less/;
    this.transform = function(file, requireNodes) {
        requireNodes.map(function(node) {
            var path = getValue(node);
            var abs = p.resolve(p.dirname(file), path);
            var line = `@import '${abs.replace("\\", "\\\\")}';`;
            console.log(`[Less]: ${line}`);
            // that.push(line + "\n");
            lines.push(line);
            clearNode(node);
        })
    }
    this._read = function() {}

    this.pipe = (function() {
        var ret = that
            .pipe(outputCss())
            .pipe(source(outputName))
            .pipe(buffer())
        return ret.pipe.bind(ret);
    })();

    function outputCss() {
        return through(function(chunk, enc, cb) {
            cb();
        }, function(cb) {
            var that = this;
            var src = lines.join("\n");
            less.render(src, function(err, output) {
                if (err) {
                    return cb(err);
                }
                that.push(output.css);
                cb();
            })
        })
    }
}
util.inherits(LessPlugin, stream.Readable);

module.exports = LessPlugin;

