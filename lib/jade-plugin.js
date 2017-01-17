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
function JadePlugin(requireMap, appName, outputName, opt) {
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
        requireNodes.map(function(node) {
            var path = getValue(node);
            if (includes[path]) {
                //已经加入过了，没啥好说的，直接删结点
                clearNode(node);
                return;
            } else if (/^\/\/.+/.test(path)) {
                // 以//开头的情况，直接展开，不用到requireMap里找了
                clearNode(node);
                includes[path] = path.slice(1);
                var line = `Include [${path}]`;
                console.log(`[Jade]: ${line}`);
                return;
            } else if (requireMap[path] === undefined) {
                // 没有配置require路径
                throw new Error(`Unknown Require: ${path}, [${file}]`);
            } else if (requireMap[path] === null) {
                // 这种情况表示直接打包进去, 不用处理，由webpack处理
                return;
            } else if (requireMap[path] && !includes[path]) {
                // 第一次require, 需要加入include
                clearNode(node);
                includes[path] = requireMap[path];
                var line = `Include [${path}] => ${requireMap[path]}`;
                console.log(`[Jade]: ${line}`);
                return;
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
