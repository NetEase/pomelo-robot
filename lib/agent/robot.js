var logging = require('../common/logging').Logger;
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var monitor  = require('../monitor/monitor');

var Robot = function(user,socket) {
  EventEmitter.call(this);
  this.user = user;
  this._log = logging;
  this.socket = socket;
  var self = this;
  socket.on('message',function(msg){
		//console.error('get message ' + JSON.stringify(msg));
	  var route = msg.route;
	  monitor.endTime(msg.route,self.user.uid,Date.now());
	  if(!route){
 	  	self._log.error('Message type error! data: ' + JSON.stringify(msg));
 	  	return;
	  }
	  self.emit(route,msg);
  });
};

util.inherits(Robot, EventEmitter);

var pro = Robot.prototype;


/**
 *对延时操作的封装 
 */
pro.done = function(){
	//process.exit();
	this.emit('done',this.user.uid);
};

/**
 * 对发送数据的封装
 */
pro.pushMessage = function(msg){
	//console.error('pushMessage message ' + JSON.stringify(msg));
	var self = this;
	if(!!msg)
    this.socket.emit('message', msg);
  monitor.beginTime(msg.route,self.user.uid,Date.now());
  this._log.debug('[client.pushMessage], msg: '+msg.route+ ' params:'+JSON.stringify(msg.params));
};

/**
 *对延时操作的封装 
 */
pro.later = function(fn,time){
	if (time>0 && typeof(fn)=='function') {
		setTimeout(fn,time);
	}
};

/**
 * 
 * 对interval操作的封装，
 * time为数组时，interval的时间为数组期间的随机数
 * 
 */
pro.interval = function(fn,time){
	var fn = arguments[0];
	var self = this;
	switch (typeof(time)) {
  	case 'number':
  		if (arguments[1]>0)	setInterval(fn,arguments[1]);
  		break;
  	case 'object':
  		var start = time[0], end = time[1];
  		var _time = Math.round(Math.random()*(end-start) +start);
  		//console.log('random time ' + _time);
  		setTimeout(function(){fn(),self.interval(fn,time);},_time); 
  		break;
  	default:
  		self._log.error('wrong argument');
  		return;
	}
};

 
exports.Robot = Robot;
