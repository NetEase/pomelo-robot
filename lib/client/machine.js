var __ = require('underscore');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var vm = require('vm');
var fs = require('fs');
var io = require('socket.io-client');
var Robot = require('./robot').Robot;
var logging = require('./logging');

// Machine gets registered as a Node on the LogServer.
// Contains config information,  pool, and socket
var Machine = function(master) {
  EventEmitter.call(this);
  this._log = new logging.Logger();
  this._conf = {};
  this._conf.master = master;
  this._conf.encoding = 'utf8';
  this.connected = false;
  this.reconnecting = false;
  var machine = this;
  this.content = fs.readFileSync(process.cwd() + '/lib/config/action.js', this._conf.encoding);
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
   	      Iuser:user,
   	      Robot:Robot
  	 };
    //var robot = new Robot(user, socket);
    var context = vm.createContext(initSandbox);
    var usingscript = vm.runInContext(this.content,context,'myfile'+user.username+'.js');
  };
 
exports.Machine = Machine;
