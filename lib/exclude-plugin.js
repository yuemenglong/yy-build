var clearNode = require("./common").clearNode;
var _ = require("lodash");

function ExcludePlugin(exclude) {
    if (!exclude) {
        exclude = [];
    }
    if (_.isPlainObject(exclude)) {
        exclude = _.keys(exclude);
    }
    //默认过滤less
    exclude.push(".*\\.less");
    //默认过滤以//开头的
    exclude.push("^//.*");
    var pattern = "^((" + exclude.join(")|(") + "))$";
    this.test = new RegExp(pattern);
    this.transform = function(file, requireNodes) {
        requireNodes.map(clearNode);
    }
}

module.exports = ExcludePlugin;
