var socket = Isocket;
var _uid = 0;
var _treasures = null;
var _username = Iuser.username;
var _password = Iuser.passwd;
var _uposX = 0;
var _uposY = 0;
var _speed = 50;

var LOGIN = 'connector.loginHandler.login';
var REGISTER = 'connector.loginHandler.register';
var PICKITEM = 'area.treasureHandler.pickItem';
var ONGENERATETREASURES = 'onGenerateTreasures';
var ONGETSCENEINFO = 'onGetSceneInfo';
var GETTREASURES = 'area.treasureHandler.getTreasures';
var GETONLINEUSERS = 'area.userHandler.getOnlineUsers';
var ONUSERJOIN = 'onUserJoin';
var ONMOVE = 'onMove';

var ONUSERLEAVE = 'onUserLeave';
var ONRANKLISTCHANGE = 'area.onRankListChange';
var ONGENTIMEREFRESH = 'onGenTimeRefresh';

var msgHandlerMap = {};

msgHandlerMap[LOGIN] = onLogin;
msgHandlerMap[REGISTER] = onRegister;
msgHandlerMap[PICKITEM] = onPickTreasure;
msgHandlerMap[ONGENERATETREASURES] = onGenerateTreasures;
msgHandlerMap[ONGETSCENEINFO] = onGetSceneInfo;
msgHandlerMap[GETTREASURES] = onGetTreasures;
msgHandlerMap[GETONLINEUSERS] = onGetOnlineUsers;
msgHandlerMap[ONUSERJOIN] = onUserJoin;
msgHandlerMap[ONMOVE] = onUserMove;
msgHandlerMap[ONUSERLEAVE] = onUserLeave;
msgHandlerMap[ONRANKLISTCHANGE] = onRankListChange;
msgHandlerMap[ONGENTIMEREFRESH] = onGenTimeRefresh;


var robot = new Robot(userData, socket);

robot.login();

robot.on('onMove', function(data){
	
});

robot.on('area.treasureHandler.getTreasures', function(data){
	
});

robot.later(30, function(){
});

robot.interval([10,30],  function(){
	robot.pushMessage();
	robot.wait(100);
    
});

robot.pushMessage();

/**
 * 捡宝物回调
 * @param {Object} data
 */
function onPickTreasure(result){
  if(result.success){
	delete _treasures[treasureId];
    console.log('success picked up treasure ' + treasureId);
  }
}

function onLogin(data){
   var userData = data.userData;
   var uid = userData.uid;
   console.log('onLogin userData: '+JSON.stringify(userData));
   if (uid <= 0) { 
     console.log("用户不存在\n uid:" + uid + " code:" + data.code);
    //登陆成功，根据数据来判断是否需要选择角色:默认直接跳转
    //switchManager.selectView("heroSelectPanel");
  }else{
     console.log("登录调用成功！用户存在\n uid:" + uid + " code:" + data.code);
     _uid = uid;
     uposX = userData.x;
     uposY = userData.y;
     pushMessage({route:"area.treasureHandler.getTreasures", params:{uid: uid}});
     pushMessage({route:"area.userHandler.addUser"});
     pushMessage({route:"area.userHandler.getOnlineUsers", params:{uid: uid}});
  }
}

function pushMessage(msg){
  console.log('[client.pushMessage], msg: '+msg.route+ ' params:'+JSON.stringify(msg.params));
  if(!!msg)
    socket.emit('message', msg);
  else
    console.log('Error message type!');
}

function onRegister(data){
  if(data.code == 500){
	console.log("注册失败，请更换用户名重试!");
    return;
  }
    
   var userData = data.userData;
   var username = userData.username;
   var uid = userData.uid;
   if (uid <= 0) { 
     console.log("注册失败！用户不存在\n sessionId:" + data.sid + " code:" + data.code);
     //登陆成功，根据数据来判断是否需要选择角色:默认直接跳转
     //switchManager.selectView("loginPanel");
   }else{
	  console.log("登录调用成功！用户已经存在\n sessionId:" + data.sid + " code:" + data.code);
//		    loginUsername = "";
      
      //clientManager.uid = userData.uid;
      //sceneManager.enterScene({}, userData);
      
      
      //clientManager.getCurrentScene();
  }  
}

function onGenerateTreasures(data){
 console.log('on generateTreasures invoked data  type: '+data.type+'  code: '+data.code);
 _treasures = data.body.treasures;
  //sceneManager.getTreasureManager().showTreasures(treasures);
  //tickViewManager.refresh(data.body.leftTime);
}

function onRankListChange(rankList){
  //rankManager.refreshView(rankList);
}
  /**
   * 初始化场景
   * @param data{
   *  type:7002,
   *  treasures:[],  //宝物信息列表
   *  users:[],
   * }
   */
function onGetSceneInfo(data){
  _treasures = data.body.treasures;
  var users = data.body.users;
  //sceneManager.getRolesManager().showRoles(users);
  //sceneManager.getTreasureManager().showTreasures(treasures);
};

function onGetTreasures(data){
  _treasures = data.result;
 // sceneManager.getTreasureManager().showTreasures(treasures);
}

function onGetOnlineUsers(data){
  var users = data.result;
  for(var key in users){
    if(users[key].uid == _uid){
      delete users[key];
      break;
    }
  }
  //sceneManager.getRolesManager().showRoles(users);
}

function onGenTimeRefresh(data){
	//tickViewManager.refresh(data.body.leftTime);
}

/**
 * 处理用户移动请求
 */
function onUserMove(data){
  //console.log("User move :" + JSON.stringify(data));
  //sceneManager.getRolesManager().moveRole(data);
}

function onUserJoin(data){
  console.log("新用户加入: " + JSON.stringify(data.user));
  //sceneManager.getRolesManager().addRole(data.user);
}

function onUserLeave(data){
  console.log("用户离开: " + JSON.stringify(data.uid));
  //sceneManager.getRolesManager().deleteRole(data.uid);
}


var action = function(){
	var data = {route:LOGIN, params:{username: _username, password:_password}};
 	socket.emit('message',data);
	socket.on('message',function(msg){
	//console.log('get message ' + JSON.stringify(msg));
	var route = msg.route;
    var code = msg.code;
    if(!route){
      console.log('Message type error! data: ' + JSON.stringify(msg));
    }
	var msgHandler = msgHandlerMap[route];
  	if(!!msgHandler && typeof(msgHandler)=='function') {
	  msgHandler(msg);
	}
})}();

var isMove = false;

setInterval(function(){
	if (_uid<=0 || !_treasures || isMove) return;
	var treas = [];
	for (var id in _treasures){
		treas.push(_treasures[id]);
	}
	var index = Math.round(Math.random()*(treas.length-1) +1);
	var treasure = treas[index];
	if (!treasure) {return;} 
	console.log(' uid ' + _uid  + ' move to x:= ' + treasure.posX + ' y:= ' + treasure.posY);
	var dis = Math.sqrt(treasure.posX * _uposX + treasure.posY * _uposY);
    var timeNum = dis / _speed * 1000;
    var startX = _uposX;
    var startY = _uposY;
	var path = [{x:startX, y:startY},{x:treasure.posX, y:treasure.posY}];
	pushMessage({route:"area.userHandler.move", params:{path: path, time: timeNum,uid:_uid}});
	isMove = true;
	setTimeout(function(){
		_uposX = treasure.posX;
		_uposY = treasure.posY;
		isMove = false;
	},timeNum); 
},1000);