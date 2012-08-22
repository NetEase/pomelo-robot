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
 * emit done event
 *
 */
pro.done = function(){
  //process.exit();
  this.emit('done',this.user.uid);
};

/**
 * wrap socket.io emit message
 *
 *@param {Object} msg
 *
 */
pro.pushMessage = function(msg){
  //console.error('pushMessage message ' + JSON.stringify(msg));
  var self = this;
  if(!!msg)
    this.socket.emit('message', msg);
  self.log.debug('[client.pushMessage], msg:'+JSON.stringify(msg));
};

var cbs = {};
/**
 *wrap socket.io send message
 *
 * @param {String} msg
 * @param {Function} cb
 * @param {Boolean} encdoe
 *
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
 * wrap setTimeout
 *
 *@param {Function} fn
 *@param {Number} time
 */
pro.later = function(fn,time){
  if (time>0 && typeof(fn)=='function') {
    setTimeout(fn,time);
  }
};

/**
 * wrap setInterval 
 * when time is Array, the interval time is thd random number
 * between then
 * 
 *@param {Function} fn
 *@param {Number} time
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

/**
 *wrap clearTimeout
 *
 * @param {Number} timerId
 *
 */
pro.clean = function(timerId){
  clearTimeOut(timerId);
}

var id=1;

/**
 *encode message
 *
 * @param {Number} id
 * @param {Object} msg
 *
 */
pro.encode = function(id,msg) {
  return Protocol.encode(id,msg.route,msg);
}

exports.Robot = Robot;
