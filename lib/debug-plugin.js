var p = require("path");

function DebugPlugin() {
    this.test = /.*/;
    this.transform = function(file) {
        console.log("[DEBUG]: " + file);
    }
}

module.exports = DebugPlugin;
