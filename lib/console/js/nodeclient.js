var Node = function(nodeId, web_client) {
  this._dom;
  this.label = nodeId;
  this.log_nodes = {};
  this.web_client = web_client;
  var node = this;
};

Node.prototype = {
  render: function() { throw "Node.render() not defined"; },
  destroy: function() { throw "Node.destroy() not defined"; }
};

try {
  module.exports = {
    Node: Node
  }
} catch(err) {}
