var msgHandlerMap = {
  'connector.loginHandler.login': onLogin,     
  'connector.loginHandler.register': onRegister,       
  'area.treasureHandler.pickItem':onPickTreasure,
  'onGenerateTreasures': onGenerateTreasures, //创建宝物
  'onGetSceneInfo': onGetSceneInfo,
  'area.treasureHandler.getTreasures': onGetTreasures,
  'area.userHandler.getOnlineUsers': onGetOnlineUsers,
  'onUserJoin': onUserJoin,
  'onMove': onUserMove,           //接受用户移动请求返回结果
  'onUserLeave': onUserLeave,
  'area.onRankListChange': onRankListChange,
  'onGenTimeRefresh': onGenTimeRefresh
};

exports.handler = msgHandlerMap;

/**
 * 捡宝物回调
 * @param {Object} data
 */
function onPickTreasure(result){
	if(result.success){
		//捡宝成功，删除宝物
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
//    loginUsername = "";
    //clientManager.uid = userData.uid;
    //sceneManager.enterScene({}, userData);
    //clientManager.getCurrentScene();
  }
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
//    loginUsername = "";
      
      //clientManager.uid = userData.uid;
      //sceneManager.enterScene({}, userData);
      
      
      //clientManager.getCurrentScene();
  }  
}

function onGenerateTreasures(data){
  console.log('on generateTreasures invoked data  type: '+data.type+'  code: '+data.code);
  var treasures = data.body.treasures;
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
  var treasures = data.body.treasures;
  var users = data.body.users;
  //sceneManager.getRolesManager().showRoles(users);
  //sceneManager.getTreasureManager().showTreasures(treasures);
};

function onGetTreasures(data){
  var treasures = data.result;
 // sceneManager.getTreasureManager().showTreasures(treasures);
}

function onGetOnlineUsers(data){
  var users = data.result;
  for(var key in users){
    if(users[key].uid == clientManager.uid){
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
  console.log("User move :" + JSON.stringify(data));
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
