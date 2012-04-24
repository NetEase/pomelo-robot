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
	var socket = io.connect(uri,{'force new connection':true});
	self.robot = new Robot(user, socket);
	var initSandbox = {
	      console:console,
	      Iuser:user,
	      robot:self.robot
	};
	self.on('runcode',function(message){
	  var route = message.route;
	  if(!route){
 	  	this._log.error('Message type error! data: ' + JSON.stringify(message));
 	  	return;
	  };
	  self.robot.pushMessage(message);
	});
	self.robot.on('done',function(msg){
		console.log('sssssssssssssssssmach done');
		self.emit('done',msg);
	});
	
	self.initSandbox = initSandbox;
};

pro.run = function() {
	var self = this;
	var context = vm.createContext(self.initSandbox);
	var usingscript = vm.runInContext(this.content,context,'myfile'+self.user.username+'.js');
};
 
exports.Machine = Machine;
