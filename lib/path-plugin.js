var P = require("path");
var fs = require("fs");
var getValue = require("./common").getValue;
var setValue = require("./common").setValue;

function root(path) {
    var parsed = P.parse(path);
    if (parsed.dir.length > 0) {
        return root(parsed.dir);
    }
    return path;
}

function checkCwdValid(cwd) {
    // var cwd = process.cwd();
    var dirs = fs.readdirSync(cwd);
    var valid = dirs.some(function(dir) {
        return dir == "node_modules";
    })
    if (!valid) {
        throw new Error("Invalid Root Location, Can't Find node_modules");
    }
    return valid;
}

function PathPlugin(cwd) {
    this.test = /^\/.*/;
    this.transform = function(file, requireNodes) {
        checkCwdValid(cwd);
        requireNodes.map(function(node) {
            var path = getValue(node);
            setValue(node, relativePath(cwd, file, path));
        })
    }
}

function relativePath(cwd, filePath, requirePath) {
    var workspace = root(P.relative(cwd, filePath));
    var absolute = P.resolve(cwd, "./" + workspace, "." + requirePath);
    var relative = P.relative(P.parse(filePath).dir, absolute).replace(/\\/g, "/");
    return relative;
}

module.exports = PathPlugin;
module.exports.relativePath = relativePath;
