var __ = require('underscore');
var io = require('socket.io-client');
var logging = require('../common/logging').Logger;
var Machine = require('./machine').Machine;
var monitor  = require('../monitor/monitor');

var STATUS_INTERVAL = 60 * 1000; // 60 seconds
var RECONNECT_INTERVAL = 15 * 1000; // 5 seconds
var HEARTBEAT_PERIOD = 30 * 1000; // 20 seconds
var HEARTBEAT_FAILS = 3; // Reconnect after 3 missed heartbeats

 
var Agent = function(conf) {
	this._log = logging;
  this._conf = {};
  this._conf.master = conf.master;
  this._conf.encoding = 'utf8';
  this._conf.message_type = 'log';
  this._conf.status_frequency =  STATUS_INTERVAL;
  this.last_heartbeat = null;
  this.messages_sent = 0;
  this.connected = false;
  this.reconnecting = false;
	var agent = this;
	this._conf.debug = conf.debug || true;
	this._conf.app = conf.app;
	this.machines = [];
};

Agent.prototype = {

  // Create socket, bind callbacks, connect to server
  connect: function() {
    var agent = this;
    var uri = agent._conf.master.host + ":" + agent._conf.master.port;    
    agent.socket = io.connect(uri);

    // TODO(msmathers): Ensure this works once socket.io bug has been fixed...
    // https://github.com/LearnBoost/socket.io/issues/473
    agent.socket.on('error', function(reason) {
      agent.reconnect();
    });

    // Register announcement callback
    agent.socket.on('connect', function() {
      agent._log.info("Connected to server, sending announcement...");
      agent.announce();
      agent.connected = true;
      agent.reconnecting = false;
      agent.last_heartbeat = new Date().getTime();
    });

    // Server heartbeat
    agent.socket.on('heartbeat', function() {
      //agent._log.info("Received server heartbeat");
      agent.last_heartbeat = new Date().getTime();
      return;
    });

    // Node with same label already exists on server, kill process
    agent.socket.on('node_already_exists', function() {
      agent._log.error("ERROR: A node of the same name is already registered");
      agent._log.error("with the log server. Change this agent's instance_name.");
      agent._log.error("Exiting.");
      process.exit(1);
    });
    //begin to run
    agent.socket.on('run', function(message) {
    	agent._log.info('run with ' + __(agent._conf.app.data).size() + ' robots  ');
    	for (var index in agent._conf.app.data) {
	    	var machine = new Machine(agent._conf.app);
				machine.run(agent._conf.app.data[index]);
				agent.machines.push(machine);
 			};
 			setInterval(function(){
 				var d = monitor.getData();
 				agent.socket.emit('report',d);
 			},3000);
    });
    agent.socket.on('runcode', function(message) {
    	agent._log.info('run code with ' + __(agent.machines).size() + ' robots,code is ' + message);
    	__.each(agent.machines,function(machine){
    		machine.emit('runcode',message);
    	});
    });
  },

  // Run log agent
  start: function() {
    var agent = this;
    agent.connect();
    // Check for heartbeat every HEARTBEAT_PERIOD, reconnect if necessary
    setInterval(function() {
      var delta = ((new Date().getTime()) - agent.last_heartbeat);
      if (delta > (HEARTBEAT_PERIOD * HEARTBEAT_FAILS)) {
        agent._log.warn("Failed heartbeat check, reconnecting...");
        agent.connected = false;
        agent.reconnect();
      }
    }, HEARTBEAT_PERIOD);
  },
  // Sends announcement to LogServer
  announce: function() {
  	var agent = this;
  	//console.log(require('util').inspect(agent.socket,true,100,100));
    this._send('announce_node', {
      client_type:'node'
    });
  },

  // Reconnect helper, retry until connection established
  reconnect: function(force) {
    if (!force && this.reconnecting) { return; }
    this.reconnecting = true;
    this._log.info("Reconnecting to server...");
    var agent = this;
    setTimeout(function() {
      if (agent.connected) { return; }
      agent.connect();
      setTimeout(function() {
        if (!agent.connected) {
          agent.reconnect(true);
        }
      }, RECONNECT_INTERVAL/2)
    }, RECONNECT_INTERVAL);
  },

  // Sends message to LogServer, gracefully handles connection failure
  _send: function(event, message) {
    try {
      this.socket.emit(event, message);
    // If server is down, a non-writeable stream error is thrown.
    } catch(err) {
      this._log.error("ERROR: Unable to send message over socket.");
      this.connected = false;
      this.reconnect();
    }
  }
}

exports.Agent = Agent;
