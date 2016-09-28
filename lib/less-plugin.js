var stream = require("stream");
var util = require("util");
var p = require("path");
var less = require("gulp-less");
var fs = require("fs");

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
// var vfs = require('vinyl-fs');
var stream = require("stream");
var getValue = require("./common").getValue;
var clearNode = require("./common").clearNode;

function LessPlugin(name) {
    stream.Readable.call(this);
    var that = this;
    this.test = /.+\.less/;
    this.transform = function(file, requireNodes) {
        requireNodes.map(function(node) {
            var path = getValue(node);
            var abs = p.resolve(p.dirname(file), path);
            var line = `@import '${abs.replace("\\", "\\\\")}';`;
            console.log(`[Less]: ${line}`);
            that.push(line + "\n");

            clearNode(node);
        })
    }
    this._read = function() {}

    this.pipe = (function() {
        var ret = that.pipe(source(name))
            .pipe(buffer())
            .pipe(less());
        return ret.pipe.bind(ret);
    })();
}
util.inherits(LessPlugin, stream.Readable);

// fs.createReadStream("test.js").pipe(source()).pipe(process.stdout);

module.exports = LessPlugin;
