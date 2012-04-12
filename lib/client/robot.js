var __ = require('underscore');
var logging = require('./logging');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var COMMAND = {};

COMMAND.LOGIN = 'connector.loginHandler.login';
COMMAND.REGISTER = 'connector.loginHandler.register';
COMMAND.PICKITEM = 'area.treasureHandler.pickItem';
COMMAND.ONGENERATETREASURES = 'onGenerateTreasures';
COMMAND.ONGETSCENEINFO = 'onGetSceneInfo';
COMMAND.GETTREASURES = 'area.treasureHandler.getTreasures';
COMMAND.GETONLINEUSERS = 'area.userHandler.getOnlineUsers';
COMMAND.ONUSERJOIN = 'onUserJoin';
COMMAND.ONMOVE = 'onMove';

COMMAND.ONUSERLEAVE = 'onUserLeave';
COMMAND.ONRANKLISTCHANGE = 'area.onRankListChange';
COMMAND.ONGENTIMEREFRESH = 'onGenTimeRefresh';

// Robot gets registered as a Node on the LogServer.
// Contains config information,  pool, and socket
var Robot = function(user,socket) {
  EventEmitter.call(this);
  this.user = user;
  this.socket = socket;
  var self = this;
  socket.on('message',function(msg){
		console.log('get message ' + JSON.stringify(msg));
	  var route = msg.route;
	  var code = msg.code;
	  if(!route){
	    console.log('Message type error! data: ' + JSON.stringify(msg));
	  }
	  self.emit(route,msg);
  });
};

util.inherits(Robot, EventEmitter);

var pro = Robot.prototype;

Robot.COMMAND = COMMAND;

pro.login = function() {
  var data = {route:COMMAND.LOGIN, params:{username:this.user.username, password:this.user.passwd}};
  this.socket.emit('message',data);
};

pro.pushMessage = function(msg){
  console.log('[client.pushMessage], msg: '+msg.route+ ' params:'+JSON.stringify(msg.params));
  if(!!msg)
    this.socket.emit('message', msg);
  else
    console.error('Error message type!');
};

 
 
exports.Robot = Robot;
