var __ = require('underscore');

// WebClient is an end-user using a browser
var WebClient = function(socket, server) {
  this.log_server = server;
  this.socket = socket;
  this.id = socket.id;
  var wc = this;

  // Join web_clients room
  socket.join('web_clients');

  // Remove WebClient from LogFiles
  socket.on('disconnect', function() {
    __(wc.watching_logs).each(function(log_file) {
      log_file.remove_web_client(wc);
    });
    socket.leave('web_clients');
  });
};

WebClient.prototype = {

  // Tell WebClient to add new Node, LogFiles
  add_node: function(node) {
    this.socket.emit('add_node', {
      nodeId: node.nodeId
    });
  },

  // Tell WebClient to remove Node, LogFiles
  remove_node: function(node) {
    this.socket.emit('remove_node', {
      node: node.nodeId
    });
  }
}

module.exports = {
  WebClient: WebClient
}
