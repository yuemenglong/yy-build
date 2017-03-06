var P = require("path");
var setValue = require("./common").setValue;
var getValue = require("./common").getValue;
var fs = require("yy-fs");
var browserify = require("browserify");

function WebReqrPlugin(dirname) {
    this.test = /.*\/src\/.*/;
    this.transform = function(file, requireNodes) {
        requireNodes.map(function(node) {
            var reqrPath = getValue(node);
            var absReqrPath = P.resolve(P.dirname(file), reqrPath);
            var relReqrPath = P.relative(dirname, absReqrPath);
            if (!/^web/.test(relReqrPath)) {
                throw Error("Web Requires Must In Web/Src Dir");
            }
            var srcPath = P.resolve(dirname, P.dirname(P.dirname(file)), reqrPath) + ".js";
            var webPath = P.resolve(dirname, P.dirname(file), reqrPath) + ".js";
            fs.mkdirSync(P.dirname(webPath));
            console.log(`[Web] Pack ${srcPath} => ${webPath}`);
            var b = browserify(srcPath);
            b.bundle().pipe(fs.createWriteStream(webPath));
        })
    }
}

module.exports = WebReqrPlugin;
