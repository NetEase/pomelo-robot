
var __ = require('underscore');

// NodeClient is a server/machine/instance running a harvester
// It has nothing to do with node.js
var NodeClient = function(nodeId, socket, server) {
  this.nodeId = nodeId;
  this.socket = socket;
  this.id = socket.id;
  this.log_server = server;
  var node = this;

  // Ping WebClient
  socket.on('ping', function(message) {
    var lf = node.log_files[message.log_file];
    lf.broadcast_ping(message);
  })

  // Send log history response to WebClient
  socket.on('history_response', function(message) {
    var wc = node.log_server.web_clients[message.client_id];
    wc.socket.emit('history_response', message);
  })
 
  // Join 'nodes' room
  socket.join('nodes');

  socket.on('disconnect', function() {
    // Notify all WebClients upon disconnect
    __(node.log_server.web_clients).each(function(web_client, client_id) {
      web_client.remove_node(node);
    });
    socket.leave('nodes');
  });
}

module.exports = {
  NodeClient: NodeClient
}
