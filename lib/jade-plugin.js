var _ = require("lodash");
var stream = require("stream");
var util = require("util");
var p = require("path");
var fs = require("fs");

var through = require("through2");
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
// var vfs = require('vinyl-fs');
var stream = require("stream");
var getValue = require("./common").getValue;
var clearNode = require("./common").clearNode;

//opt:{preclude:[`script(src="xxx")`], prescript:`alert("hello")`}
function JadePlugin(map, appName, outputName, opt) {
    opt = opt || {};
    stream.Readable.call(this);
    var that = this;
    var includes = {};
    var tpl = fs.readFileSync(__dirname + "/jade-plugin.jade").toString();
    var match = tpl.match(/^(.*)\${INCLUDE}.*$/m);
    var includeAnchor = match[0];
    var includeIndent = match[1];
    var match = tpl.match(/^(.*)\${PRECLUDE}.*$/m);
    var precludeAnchor = match[0];
    var precludeIndent = match[1];
    var preclude = (opt.preclude || []).map(function(line) {
        return util.format("%s%s", precludeIndent, line);
    }).join("\n");

    this.test = /^[^.].*/;
    this.transform = function(file, requireNodes) {
        var restLines = [];
        requireNodes.map(function(node) {
            var path = getValue(node);
            if (map[path] === undefined) {
                throw new Error(`Unknown Require: ${path}, [${file}]`);
            }
            if (!map[path]) {
                // restLines.push(lines[i]);
                return;
            }
            clearNode(node);

            if (!includes[path]) {
                if (map[path].length) {
                    includes[path] = map[path];
                    var line = `Include [${path}] => ${map[path]}`;
                } else {
                    var line = `Include [${path}]`;
                }
                console.log(`[Jade]: ${line}`);
            }
        })
    }
    this._read = function() {}

    this.pipe = (function() {
        var ret = that
            .pipe(outputJade())
            .pipe(source(outputName))
            .pipe(buffer());
        return ret.pipe.bind(ret);
    })();

    function outputJade() {
        return through(function(chunk, enc, cb) {
            cb();
        }, function(cb) {
            var lines = _.flatten(_.values(includes));
            var includeOutput = lines.map(function(l) {
                if (_.endsWith(l, ".js")) {
                    return util.format("%sscript(src='%s')", includeIndent, l)
                } else if (_.endsWith(l, ".css")) {
                    return util.format("%slink(rel='stylesheet' href='%s')", includeIndent, l);
                } else {
                    throw new Error("Unknown Include Type: " + l);
                }
            }).join("\n");
            var content = tpl
                .replace(/\${APP}/g, appName)
                .replace(includeAnchor, includeOutput)
                .replace(precludeAnchor, preclude)
                .replace(/\${PRESCRIPT}/, opt.prescript || "");
            this.push(content);
            cb();
        })
    }
}
util.inherits(JadePlugin, stream.Readable);

module.exports = JadePlugin;
