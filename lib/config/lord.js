var pomelo = {};
pomelo.users = {};
pomelo.entitys = {};
pomelo.isMove = false;
pomelo.isDead = false;

var msgTempate = {route:'chat.chatHandler.send',scope:'D41313',content:'老子要杀怪了'};

var login = function(){
    //console.log('%j',Iuser);
	  var data = {route:'connector.loginHandler.login', username:Iuser.username, password:Iuser.passwd};
	  robot.pushMessage(data);
};

login();

/**
 * 捡宝物回调
 * @param {Object} data
 */
robot.on('area.treasureHandler.pickItem',function(result){
    if(result.success){
	      delete _treasures[treasureId];
        //console.log('success picked up treasure ' + treasureId);
    }
});


/**
 * 处理登录请求
 */
robot.on('connector.loginHandler.login', function(data){
	  var user = data.user;
	  var player = data.player;
    //console.log('  onLogin userData:  '+JSON.stringify(data));
    if (player.id <= 0) { 
        console.log("用户不存在\n uid:" + uid + " code:" + data.code);
    }else{
        pomelo.uid = user.id;
        pomelo.playerId = player.id;
        pomelo.areaId = player.areaId;
        pomelo.player = player;
        pomelo.entityId = player.entityId;
        robot.pushMessage({route:"area.playerHandler.enterScene", uid:pomelo.uid, playerId: pomelo.playerId, areaId: pomelo.areaId});
        msgTempate.uid = pomelo.uid;
        msgTempate.playerId = pomelo.playerId;
        msgTempate.from = pomelo.player.name,
        msgTempate.areaId = pomelo.areaId;
        robot.interval(move,1000);
    }
});


/**
 * 处理在线用户请求
 */
robot.on('area.userHandler.getOnlineUsers',function(data){
	  //console.log(' getOnline Users data ' + JSON.stringify(data));
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
    //console.log("用户离开: " + JSON.stringify(data));
    delete pomelo.users[data.playerId];
});
/**
 * 处理用户加入请求
 */
robot.on('onPlayerAdd',function(data){
    console.log("新用户加入: " + JSON.stringify(data));
    pomelo.users[data.player.id] = data.player;
});

/**
 * 处理用户攻击请求
 */
robot.on('onAttack',function(data){
    console.log("fighting: " + JSON.stringify(data));
    if (data.result.result === '2') {
        if (data.targetId !== pomelo.entityId){
            delete pomelo.entitys[data.targetId];
        } else {
            pomelo.isDead = true;
            console.error('oh,my god,self died');
        }
    }
});

/**
 * 处理用户移动请求
 */
robot.on('area.userHandler.move',function(data){
    if (_uid==data.body.uid){
  	    this.done();
    }
});

robot.on('onMove',function(data){
    var entity = pomelo.entitys[data.entityId] || {} ;
    entity.path = data.path;
    pomelo.entitys[data.entityId] = entity;    
});


var move = function(){
    if (pomelo.isDead || pomelo.isMove) return;
    var nearst = 999999; 
    var nearstId = 0;
    for (var id in pomelo.entitys){
        var entity = pomelo.entitys[id];
        console.error('vvv%j',entity);
        var ex = entity.path[0].x;
        var ey = entity.path[0].y;
        var distance = (pomelo.player.x -ex) * (pomelo.player.x -ex) + (pomelo.player.y - ey) *  (pomelo.player.y - ey);
        if (nearst <= distance){
            nearstId = id;
        }
	  }
    console.error(' near ' + nearstId);
    var skillId = 1;
    var route = 'area.fightHandler.attack';
    if (nearstId>0) {
        robot.pushMessage({route : route,areaId :pomelo.areaId, playerId: pomelo.playerId, targetId: nearstId, skillId: skillId });
        pomelo.isMove = true;
		    robot.pushMessage(msgTempate);
    }
};

