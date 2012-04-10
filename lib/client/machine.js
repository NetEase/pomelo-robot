var __ = require('underscore');
var logging = require('./logging');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var vm = require('vm');
var fs = require('fs');
var io = require('socket.io-client');


// Machine gets registered as a Node on the LogServer.
// Contains config information,  pool, and socket
var Machine = function(master) {
  EventEmitter.call(this);
  this._log = new logging.Logger();
  this._conf = {};
  this._conf.master = master;
  this._conf.encoding = 'utf8';
  this._conf.message_type = 'log';
  this.last_heartbeat = null;
  this.messages_sent = 0;
  this.connected = false;
  this.reconnecting = false;
  this.log_files = {};
  var machine = this;
  this.content = fs.readFileSync(process.cwd() + '/lib/config/action.js', 'utf8');
};

util.inherits(Machine, EventEmitter);

var pro = Machine.prototype;

pro.run = function(user) {
    var self = this;
    var uri = self._conf.master.host + ":" + self._conf.master.port;
    var socket = io.connect(uri,{'force new connection':true});
    var initSandbox = {
    	  Isocket:socket,
   	      console:console,
    	  setInterval:setInterval,
   	      process:process,
   	      setTimeout:setTimeout,
   	      Iuser:user
  	 };
    var context = vm.createContext(initSandbox);
    var usingscript = vm.runInContext(this.content,context,'myfile'+user.username+'.js');
  };
 
exports.Machine = Machine;
