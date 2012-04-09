var __ = require('underscore');
var io = require('socket.io-client');
var logging = require('./logging');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var STATUS_INTERVAL = 60 * 1000; // 60 seconds
var RECONNECT_INTERVAL = 15 * 1000; // 5 seconds
var HEARTBEAT_PERIOD = 30 * 1000; // 20 seconds
var HEARTBEAT_FAILS = 3; // Reconnect after 3 missed heartbeats

// Machine gets registered as a Node on the LogServer.
// Contains config information,  pool, and socket
var Machine = function(master) {
  EventEmitter.call(this);
  this._log = new logging.Logger();
  this._conf = {};
  this._conf.master = master;
  this._conf.encoding = 'utf8';
  this._conf.message_type = 'log';
  this._conf.status_frequency =  STATUS_INTERVAL;
  this.last_heartbeat = null;
  this.messages_sent = 0;
  this.connected = false;
  this.reconnecting = false;
  this.log_files = {};
  var harvester = this;
};

util.inherits(Machine, EventEmitter);

var pro = Machine.prototype;

pro.connect = function() {
    var harvester = this;
    var uri = harvester._conf.master.host + ":" + harvester._conf.master.port;
    harvester.socket = io.connect(uri);
    // TODO(msmathers): Ensure this works once socket.io bug has been fixed...
    // https://github.com/LearnBoost/socket.io/issues/473
    harvester.socket.on('error', function(reason) {
      harvester.reconnect();
    });

    // Register announcement callback
    harvester.socket.on('connect', function() {
      harvester._log.info("Connected to server, sending announcement...");
      //harvester.announce();
      harvester.connected = true;
      harvester.reconnecting = false;
      harvester.last_heartbeat = new Date().getTime();
    });

    // Server message
    harvester.socket.on('message', function(msg) {
      //harvester._log.info("Received server message " + JSON.stringify(msg));
      harvester.emit('response',msg);
    });
    
    harvester.socket.on('clientmessage', function(message) {
  		//console.log('server node get message from master  ' + harvester.socket + ' ' + JSON.stringify(message));
    	if (message.method==='getSystem') {
    		harvester.socket.emit('clientmessage',{method:message.method,body:monitor.getSysInfo()});
    	}	else {
    		harvester.socket.emit('clientmessage',{method:message.method,body:monitorService.getDataMap()});
    	}
    });
 

  };
/**
 * 
 */
pro.run = function() {
  var harvester = this;
  harvester.connect();
};
/**
 * execute instruction
 */
pro.go = function() {
  var harvester = this;
  var data = {route:"connector.loginHandler.login", params:{username: 'xcc1', password: 'test1'}};
  harvester.socket.emit('message',data);
  //data = {route:"area.treasureHandler.getTreasures", params:{uid: uid}});
  //data = {route:"area.userHandler.addUser"};
  //harvester.socket.emit('message',data);
  //data = {route:"area.userHandler.getOnlineUsers", params:{uid: uid}};
};
 
pro.login = function() {
	  var harvester = this;
	  //var data = {route:"connector.loginHandler.login", params:{username: 'xcc4', password: 'test1'}};
	  //harvester.socket.emit('message',data);
	  //data = {route:"area.treasureHandler.getTreasures", params:{uid: uid}});
	  var data = {route:"area.userHandler.addUser"};
	  harvester.socket.emit('message',data);
	  //data = {route:"area.userHandler.getOnlineUsers", params:{uid: uid}};
};



exports.Machine = Machine;
