var _uid = 0;
var _treasures = [];
var _users = [];
var _uposX = 0;
var _uposY = 0;
var _speed = 50;
var _isMove = false;

var robot = new Robot(Iuser, Isocket);
 
var login = function(){
	var data = {route:'connector.loginHandler.login', params:{username:Iuser.username, password:Iuser.passwd}};
	robot.pushMessage(data);
};
 
login();

//robot.interval([10,30],  function(){
//	robot.pushMessage();
//	robot.wait(100);
//});


/**
 * 捡宝物回调
 * @param {Object} data
 */
robot.on('area.treasureHandler.pickItem',function(result){
  if(result.success){
	  delete _treasures[treasureId];
    console.log('success picked up treasure ' + treasureId);
  }
});


/**
 * 处理登录请求
 */
robot.on('connector.loginHandler.login', function(data){
	var userData = data.userData;
  var uid = userData.uid;
  console.log('onLogin userData: '+JSON.stringify(userData));
  if (uid <= 0) { 
    console.log("用户不存在\n uid:" + uid + " code:" + data.code);
  }else{
    console.log("登录调用成功！用户存在\n uid:" + uid + " code:" + data.code);
    _uid = uid;
    _uposX = userData.x;
    _uposY = userData.y;
    robot.pushMessage({route:"area.treasureHandler.getTreasures", params:{uid: uid}});
    robot.pushMessage({route:"area.userHandler.addUser"});
    robot.pushMessage({route:"area.userHandler.getOnlineUsers", params:{uid: uid}});
  }
});

/**
 * 处理自动生成宝物请求
 */
robot.on('onGenerateTreasures',function(data){
  console.log('on generateTreasures invoked data  type: '+data.type+'  code: '+data.code);
  _treasures = data.body.treasures;
});



/**
 * 处理宝物请求
 */
robot.on('area.treasureHandler.getTreasures',function(data){
	_treasures = data.result;
});

/**
 * 处理在线用户请求
 */
robot.on('area.userHandler.getOnlineUsers',function(data){
	_users = data.result;
  for(var key in _users){
    if(_users[key].uid == _uid){
      delete _users[key];
      break;
    }
  }
});
 
/**
 * 处理用户离开请求
 */
robot.on('onUserLeave',function(data){
  console.log("用户离开: " + JSON.stringify(data.uid));
});
/**
 * 处理用户加入请求
 */
robot.on('onUserJoin',function(data){
  console.log("新用户加入: " + JSON.stringify(data.user));
});

/**
 * 处理用户移动请求
 */
robot.on('onMove',function(data){
  console.log("用户移动: " + JSON.stringify(data));
});


robot.interval(function(){
	//console.log(' uid ' + _uid  + ' ' + _isMove);
	if (_uid<=0 || !_treasures || _isMove) return;
	var treas = [];
	for (var id in _treasures){
		treas.push(_treasures[id]);
	}
	var index = Math.round(Math.random()*(treas.length-1) +1);
	var treasure = treas[index];
	if (!treasure) {return;} 
	var dis = Math.sqrt(treasure.posX * _uposX + treasure.posY * _uposY);
  var timeNum = dis / _speed * 1000;
  console.log(' uid ' + _uid  + ' move to x:= ' + treasure.posX + ' y:= ' + treasure.posY + ' time: ' + timeNum );
  var startX = _uposX;
  var startY = _uposY;
	var path = [{x:startX, y:startY},{x:treasure.posX, y:treasure.posY}];
	robot.pushMessage({route:"area.userHandler.move", params:{path: path, time: timeNum,uid:_uid}});
	_isMove = true;
	robot.later(function(){
		_uposX = treasure.posX;
		_uposY = treasure.posY;
		_isMove = false;
	},timeNum); 
},[1000,3000]);