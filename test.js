var Build = require(".");
var DebugPlugin = Build.DebugPlugin;
var ExcludePlugin = Build.ExcludePlugin;
var ImgPlugin = Build.ImgPlugin;
var JadePlugin = Build.JadePlugin;
var LessPlugin = Build.LessPlugin;
var PathPlugin = Build.PathPlugin;

var browserify = require("browserify");

var b = browserify();
b.add("./test.js");
var build = new Build.Browserify(b);
build.plugin(new DebugPlugin());
b.bundle();
