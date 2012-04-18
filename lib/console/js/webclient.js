// WebClient is instantiated by a browser.  It contains the socket connection,
// as well as Node, Stream, and Histories pools.
var _node = {Node: Node};

var WebClient = function(io) {
  this.nodes = {};
  this.ids = {};
  this.streams = {};
  this.histories = {};
  this.stats = {
    messages: 0,
    nodes: 0,
    start: new Date()
  };
  this.connected = false;
  var wc = this;

  // Create socket
  //alert(window.location.hostname);
  this.socket = io.connect('http://'+window.location.hostname+':8888');

  // Register connect callback
  this.socket.on('connect', function() {
    wc.connected = true;
    wc.socket.emit('announce_web_client');
    //wc.socket.emit('message',{method:'getNode',body:[]});
  });
  var isInited = false;
  // Add a new Node to pool
  this.socket.on('add_node', function(message) {
  	//alert(JSON.stringify(message));
  	var nodeId = message.nodeId;
  	var iport = message.iport;
  	//for (var id in message.logs) {
  		if (!wc.ids[nodeId]){
  			wc.add_node(nodeId,iport);
  			wc.ids[nodeId] = nodeId;
  			showUI('block');
  		} else {
  			console.log('duplicated server add ' + nodeId);
  		}
  	//}
  	//console.log(JSON.stringify(wc.ids));
  });
  
  // Remove Node from pool
  this.socket.on('remove_node', function(message) {
    wc.remove_node(message.node);
  });

  // Render history response to screen
  // Update total message count stats
  this.socket.on('stats', function(message) {
    if (!wc.stats.message_offset) {
      wc.stats.message_offset = message.message_count;
    }
    wc.stats.messages = message.message_count - wc.stats.message_offset;
  });

}

function showUI(value){
	$("#run-button").css('display',value);
	$("#runcode-button").css('display',value);
	$("#codeinput").css('display',value);
}

WebClient.prototype = {

  // Add a new Node to pool
  add_node: function(nodeId,iport) {
    var node = new _node.Node(nodeId,iport,this);
    node.render();
    var nodeId = nodeId;
    this.nodes[nodeId] = node;
    this.stats.nodes++;
  },

  // Remove Node from pool
  remove_node: function(nodeId) {
    var node = this.nodes[nodeId];
    node.destroy();
    this.stats.nodes--;
    delete this.nodes[node.nodeId];
    if (this.stats.nodes<=0){
    	showUI('none');
    }
  },

  // Render all LogFiles & Stream/History screens
  // Useful for screen open/closing
  rerender: function() {
    _(this.nodes).each(function(node, nlabel) {
      _(node.log_nodes).each(function(log_file, llabel) {
        log_file.render();
      });
    });
  },
  // Resize screens, defined in web_client.jquery.js
  resize: function() { throw Error("WebClient.resize() not defined"); },
 
}

// Export for nodeunit tests
try {
  exports.WebClient = WebClient;
} catch(err) {
	
}
