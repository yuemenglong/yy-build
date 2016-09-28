var clearNode = require("./common").clearNode;

function ExcludePlugin(exclude) {
    var pattern = "^((" + exclude.join(")|(") + "))$";
    this.test = new RegExp(pattern);
    this.transform = function(file, requireNodes) {
        requireNodes.map(clearNode);
    }
}

module.exports = ExcludePlugin;
