var util = require('util');
var EventEmitter = require('events').EventEmitter;
var vm = require('vm');
var fs = require('fs');
var io = require('socket.io-client');
var Robot = require('./robot').Robot;
var logging = require('../common/logging').Logger;


var Machine = function(master,user) {
  EventEmitter.call(this);
  this._log = logging;
  this._conf = {};
  this._conf.master = master;
  this._conf.encoding = 'utf8';
  this.connected = false;
  this.reconnecting = false;
  var machine = this;
  this.content = fs.readFileSync(process.cwd() + '/lib/config/action.js', this._conf.encoding);
  this.user = user;
  this.prepare();
};

util.inherits(Machine, EventEmitter);

var pro = Machine.prototype;

pro.prepare = function() {
	var self = this;
	var user = self.user;
	var uri = self._conf.master.host + ":" + self._conf.master.port;
	self.socket = io.connect(uri,{'force new connection':true});

};

pro.run = function() {
	var self = this;
	var robot = new Robot(self.user, self.socket);
	var initSandbox = {
	      console:console,
	      Iuser:self.user,
	      robot:robot
	};
	self.on('runcode',function(message){
	  var route = message.route;
	  if(!route){
 	  	this._log.error('Message type error! data: ' + JSON.stringify(message));
 	  	return;
	  };
	  self.robot.pushMessage(message);
	});
	
	robot.on('done',function(msg){
		self.emit('done',msg);
	});
	
	var context = vm.createContext(initSandbox);
	vm.runInContext(this.content,context);
};
 
exports.Machine = Machine;
