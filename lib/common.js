exports.getValue = function(node) {
    return node.arguments[0].value;
}

exports.setValue = function(node, value) {
    node.arguments[0].value = value;
}

exports.replaceContent = function(node, content) {
    node.type = "Literal";
    node.value = content;
    node.raw = `"${content}"`;
}

exports.clearNode = function(node) {
    while (node.$parent) {
        node = node.$parent;
        if (node.type == "VariableDeclaration" ||
            node.type == "ExpressionStatement") {
            node.type = "ExpressionStatement";
            node.expression = { type: "Identifier", name: "" };
            return;
        }
    }
    throw new Error("Can't Find Node Parent Which Can Clear");
}
