var util = require('util');
var EventEmitter = require('events').EventEmitter;
var vm = require('vm');
var fs = require('fs');
var io = require('socket.io-client');
var Robot = require('./robot').Robot;
var logging = require('../common/logging').Logger;


var Machine = function(app,user,code) {
  EventEmitter.call(this);
  this._log = logging;
  this._conf = {};
  this._conf.app = app;
  this._conf.encoding = 'utf8';
  this.connected = false;
  this.reconnecting = false;
  var machine = this;
  if (!!code){
  	this.content = code;y
  } else {
  	this.content = fs.readFileSync(process.cwd() + '/lib/config/lord.js', this._conf.encoding);
  }
  this.user = user;
  this.prepare();
};

util.inherits(Machine, EventEmitter);

var pro = Machine.prototype;

pro.prepare = function() {
	var self = this;
	var user = self.user;
	var uri = self._conf.app.host + ":" + self._conf.app.port;
	self.socket = io.connect(uri,{'force new connection':true,'try multiple transports':false});
};

pro.run = function() {
	var self = this;
	var robot = new Robot(self.user, self.socket);
	var initSandbox = {
	      console:console,
	      Iuser:self.user,
	      robot:robot
	};
	robot.on('done',function(msg){
		self.emit('done',msg);
	});
	var context = vm.createContext(initSandbox);
	vm.runInContext(this.content,context);
};
 
exports.Machine = Machine;
