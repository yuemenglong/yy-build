var _ = require("lodash");
var P = require("path");
var through = require('through2');
var stream = require("stream");
var esprima = require("esprima");
var escodegen = require("escodegen");
var estraverse = require("estraverse");
var getValue = require("./lib/common").getValue;

var DebugPlugin = require("./lib/debug-plugin");
var ExcludePlugin = require("./lib/exclude-plugin");
var ImgPlugin = require("./lib/img-plugin");
var JadePlugin = require("./lib/jade-plugin");
var LessPlugin = require("./lib/less-plugin");
var PathPlugin = require("./lib/path-plugin");
var WebReqrPlugin = require("./lib/web-reqr-plugin");

var requirePattern = /^.*require\((['"]).+\1\).*$/gm;
var pathPattern = /.*require\((['"])(.+)\1\).*/;
var useStrictPattern = /^(['"])use strict\1.*/g

var IGNORES = [];

function ignore(igs) {
    IGNORES = _.flatten([igs]);
}

function getRequirementNodes(ast) {
    var ret = [];
    var stack = [];
    estraverse.traverse(ast, {
        enter: function(node) {
            if (node.type == "CallExpression" &&
                node.callee.type == "Identifier" &&
                node.callee.name == "require") {
                ret.push(node);
            }
            if (stack.length) {
                node.$parent = stack[0];
            }
            stack.unshift(node);
        },
        leave: function(node) {
            stack.shift();
        }
    })
    return ret;
}

function transform(file, content, plugins) {
    if (IGNORES.indexOf(P.extname(file)) >= 0) {
        return content;
    }
    try {
        // var ast = esprima.parse(content, { sourceType: "module" });
        var ast = esprima.parse(content);
    } catch (ex) {
        var info = `Parse [${file}] Fail`;
        var line = _.times(info.length, _.constant("-")).join("");
        console.log(`+${line}+`);
        console.log(`|${info}|`);
        console.log(`+${line}+`);
        throw ex;
    }
    var nodes = getRequirementNodes(ast);
    plugins.forEach(function(plugin) {
        var matches = nodes.filter(function(node) {
            var value = getValue(node) || "";
            return plugin.test.test(value);
        })
        if (matches.length === 0) {
            return;
        }
        plugin.transform(file, matches, ast);
    });
    content = escodegen.generate(ast);
    return content;
}

function wrapPlugin(ret) {
    ret.plugin = function() {
        ret.plugins = _.concat(ret.plugins, arguments);
    }
    ret.plugins = [];
}

function wrapEvent(obj, ret) {
    obj.on("end", function() {
        ret.plugins.map(function(o) {
            if (o instanceof stream.Readable) {
                o.push(null);
            }
        })
    })
}

function Browserify(browserify) {
    if (!browserify) {
        throw new Error("Must Pass Browserify As Arguments When Use Prerequire Transform");
    }
    var ret = function(file, opt) {
        var buf = [];
        var obj = through(function(chunk, enc, cb) {
            buf.push(chunk);
            return cb();
        }, function(cb) {
            var content = Buffer.concat(buf).toString();
            content = transform(file, content, ret.plugins);
            this.push(new Buffer(content));
            return cb();
        });
        // wrapEvent(obj, ret);
        return obj;
    }
    wrapPlugin(ret);
    browserify.on('bundle', function(bundle) {
        bundle.on("end", function() {
            ret.plugins.map(function(o) {
                if (o instanceof stream.Readable) {
                    o.push(null);
                }
            })
        })
    })
    browserify.transform(ret);
    return ret;
}

function Build() {
    var ret = function() {
        var obj = through.obj(function(file, enc, cb) {
            var filePath = _.nth(file.history, -1);
            var content = transform(filePath, file.contents.toString(), ret.plugins);
            file.contents = new Buffer(content);
            this.push(file);
            return cb();
        });
        // wrapEvent(obj, ret);
        return obj;
    }
    wrapPlugin(ret);
    return ret;
}

Build.Browserify = Browserify;

Build.DebugPlugin = DebugPlugin;
Build.ExcludePlugin = ExcludePlugin;
Build.ImgPlugin = ImgPlugin;
Build.JadePlugin = JadePlugin;
Build.LessPlugin = LessPlugin;
Build.PathPlugin = PathPlugin;
Build.WebReqrPlugin = WebReqrPlugin;

Build.ignore = ignore;

module.exports = Build;
