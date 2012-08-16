var logging = require('../common/logging').Logger;
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var monitor = require('../monitor/monitor');
var Protocol = require('pomelo-protocol');

var Robot = function(user,socket) {
  EventEmitter.call(this);
  this.user = user;
  this.log = logging;
  this.socket = socket;
  var self = this;
  socket.on('message',function(data){
    var msg = data;
    if(typeof data ==='string') {
      msg = JSON.parse(data);
    }
    if(msg instanceof Array) {
      for(var i=0, l=msg.length; i<l; i++) {
        process(msg[i]);
      }
    } else {
      process(msg);
    }
    function processRoute(id,msg){
      if (!!msg.route) {
        var route = msg.route;
        self.emit(route,msg);
        var tid = id || msg.id;
        monitor.endTime(route,tid,Date.now());
      }
    }
    function process(data) {
      var msg = data;
      if (!!msg.route) {
        processRoute(null,msg);
        return;
      } else {
        var id = data.id;
        var msg = data.body;
        if (!!msg.route) { processRoute(id,msg);} 
        if (!!cbs[data.id]) {
          cbs[data.id](msg);
          delete cbs[data.id];
        }
      }
    }
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
 * 对发送数据的emit封装
 */
pro.pushMessage = function(msg,watched){
  //console.error('pushMessage message ' + JSON.stringify(msg));
  var self = this;
  if(!!msg)
    this.socket.emit('message', msg);
  self.log.debug('[client.pushMessage], msg:'+JSON.stringify(msg));
};

var cbs = {};
/**
 * 对发送数据的send封装
 */
pro.request = function(msg,cb,encode){
  var self = this;
  if(!!msg) {
    var dmsg = null;
    var i = id++;
    dmsg = self.encode(i,msg);
    this.socket.send(dmsg);
    if (!!cb) cbs[i] = cb;
    monitor.beginTime(msg.route,i,Date.now());
  }
  self.log.debug('[client.pushMessage], msg:'+JSON.stringify(msg));
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
    var time = Math.round(Math.random()*(end-start) +start);
    //console.log('random time ' + _time);
    setTimeout(function(){fn(),self.interval(fn,time);},time); 
    break;
  default:
    self.log.error('wrong argument');
    return;
  }
};


pro.clean = function(timeId){
  clearTimeOut(timeId);
}

var id=1;

pro.encode = function(id,msg) {
  return Protocol.encode(id,msg.route,msg);
}

exports.Robot = Robot;
