var logging = require('../common/logging');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Robot = function(user,socket) {
  EventEmitter.call(this);
  this.user = user;
  this._log = new logging.Logger();
  this.socket = socket;
  var self = this;
  socket.on('message',function(msg){
		//console.log('get message ' + JSON.stringify(msg));
	  var route = msg.route;
 	  if(!route){
 	  	this._log.error('Message type error! data: ' + JSON.stringify(msg));
	  }
	  self.emit(route,msg);
  });
};

util.inherits(Robot, EventEmitter);

var pro = Robot.prototype;
/**
 * 对发送数据的封装
 */
pro.pushMessage = function(msg){
  if(!!msg)
    this.socket.emit('message', msg);
  this._log.info('[client.pushMessage], msg: '+msg.route+ ' params:'+JSON.stringify(msg.params));
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
  		this._log.error('wrong argument');
  		return;
	}
};

 
exports.Robot = Robot;
