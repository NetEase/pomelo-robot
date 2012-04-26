var io = require('socket.io');
var __ = require('underscore');
var _nodeclient = require('./nodeclient.js');
var _wc = require('./webclient.js');
var logging = require('../common/logging').Logger;
var stat  = require('../monitor/stat');
var starter = require('./starter');

var STATUS_INTERVAL = 60 * 1000; // 60 seconds
var HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

// Server runs a regular HTTP server
// Announce messages add each client to the appropriate pools
var Server = function() {
	this._log = logging;
  this.nodes = {};
  this.web_clients = {};
  this.message_count = 0;
  var rserver = this;

  // Print status every minute
  setInterval(function() {
    rserver._log.info("Nodes: " + __(rserver.nodes).size() + ", " +
      "WebClients: " + __(rserver.web_clients).size());  
  }, STATUS_INTERVAL);
};

Server.prototype = {
		
  // Create HTTP Server, bind socket
  listen: function(port) {
    this.io = io.listen(port);
    this.register();
  },
  // Registers new Node with Server, announces to WebClients
  announce_node: function(socket, message) {
    var rserver = this;
    var nodeId = message.nodeId;
    //console.log(' announce_node %j ',message.node);
    // If this node already exists, ignore announcemen
    if (!!rserver.nodes[nodeId]) {
      this._log.warn("Warning: Node '" + nodeId + "' already exists, delete old items ");
      //socket.emit('node_already_exists');
      //return;
      delete rserver.nodes[nodeId];
    }

    var node = new _nodeclient.NodeClient(nodeId,socket, this);
    rserver.nodes[nodeId] = node;

  	//console.log(JSON.stringify(rserver.web_clients));
    // Tell all WebClients about new Node
    __(rserver.web_clients).each(function(web_client) {
      web_client.add_node(node);
    });

    socket.on('disconnect', function() {
      delete rserver.nodes[nodeId];
      __(rserver.web_clients).each(function(web_client) {
        web_client.remove_node(node);
      });
      stat.clear(nodeId);
    });
    
    socket.on('report', function(message) {
    		//console.log('merge ' + nodeId + ' ' +message.id);
    		stat.merge(nodeId,message.id,message.data);
    });
  },
  // Registers new WebClient with Server
  announce_web_client: function(socket) {
    var rserver = this;
    var web_client = new _wc.WebClient(socket, rserver);
    rserver.web_clients[web_client.id] = web_client;
    // Tell new WebClient about all nodes
    __(rserver.nodes).each(function(node, nlabel) {
      web_client.add_node(node);
    });

    socket.on('webreport', function(message) {
    	socket.emit('webreport',stat.getData());
    });

    socket.on('disconnect', function() {
      delete rserver.web_clients[web_client.id];
    });

  },

  // Register announcement, disconnect callbacks
  register: function() {
    var rserver = this;
    rserver.io.set('log level', 1); // TODO(msmathers): Make configurable
    rserver.io.sockets.on('connection', function(socket) {
      socket.on('announce_node', function(message) {
        rserver._log.info("Registering new node " + JSON.stringify(message));
        rserver.announce_node(socket, message);
      });
      socket.on('announce_web_client', function(message) {
        //rserver._log.info("Registering new web_client");
        rserver.announce_web_client(socket);
        socket.on('run', function(msg) {
    			console.log('server begin notify client to run machine...');
    			rserver.io.sockets.in('nodes').emit('run',msg);
     		  return ;
    		});	//on message end
        socket.on('ready', function(msg) {
    			console.log('server begin reday client to run machine...');
    			//rserver.io.sockets.in('nodes').emit('run',msg);
    			stat.clear();
    			starter.run(msg);
     		  return ;
    		});	//on message end
        socket.on('runcode', function(msg) {
    			console.log('server begin notify client to run runcode...' + msg);
    			rserver.io.sockets.in('nodes').emit('runcode', msg);
     		  return ;
    		});	//on message end
      });
    });

    // Broadcast stats to all clients
    setInterval(function() {
      rserver.io.sockets.in('web_clients').emit('stats', {
        message_count: rserver.message_count
      });
    }, 1000);

    // Broadcast heartbeat to all clients
    setInterval(function() {
      rserver.io.sockets.emit('heartbeat');
    }, HEARTBEAT_INTERVAL); 
  },
  getNode:function(msg){
  	msg.socket.emit(msg.method,app.servers);
  },
}

exports.Server = Server;
