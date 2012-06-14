var _uid = 0;
var _areaId = 0;
var _treasures = [];
var _users = [];
var _uposX = 0;
var _uposY = 0;
var _speed = 50;
var _isMove = false;

//var robot = new Robot(Iuser, Isocket);
 
var login = function(){
	var data = {route:'connector.loginHandler.login', username:Iuser.username, password:Iuser.passwd};
	robot.pushMessage(data);
};

var _paths = [];
var _stepCount = 10;
var _index = 0;
var MAP_WIDTH = 2000;
var MAP_HEIGHT = 1200;

var genPaths = function() {
  for(var i=0; i<_stepCount; i++) {
    _paths[i] = {x: Math.random() * 2000, y: Math.random() * 1200};
  }
};

genPaths();
robot.later(login, 1000);

/**
 * 处理登录请求
 */
robot.on('connector.loginHandler.login', function(data) {
	var userData = data.userData;
  var uid = userData.uid;
  if (uid <= 0) { 
    console.log("用户不存在\n uid:" + uid + " code:" + data.code);
  }else{
    _uid = uid;
    _uposX = userData.x;
    _uposY = userData.y;
    _areaId = userData.sceneId;
    robot.pushMessage({route: "area.userHandler.addUser"});
    robot.later(move, 2000);
  }
});

//robot.on('area.userHandler.addUser', function(data) {
//  console.error('haha~~~~~~~~~~~~~~');
//});

/**
 * 处理用户移动请求
 */
robot.on('area.userHandler.move',function(data){
  //if (_uid == data.body.uid){
  //  this.done();
  //}
});

robot.on('onMove',function(data){
});

var move = function(){
  if (_uid<=0 || _isMove) {
    return;
  }

  if(_index >= _paths.length) {
    robot.done();
    return;
  }

  var step = _paths[_index++];

  var dx = _uposX - step.x;
  var dy = _uposY - step.y;
	var dis = Math.sqrt(dx * dx + dy * dy);
  var timeNum = dis / _speed * 1000;
  var startX = _uposX;
  var startY = _uposY;
	var path = [{x:startX, y:startY}, {x:step.x, y: step.y}];
	robot.pushMessage({route:"area.userHandler.move", path: path, time: timeNum,uid: _uid});
	_isMove = true;
	robot.later(function(){
		_uposX = step.x;
		_uposY = step.y;
		_isMove = false;
    move();
	}, timeNum); 
};

