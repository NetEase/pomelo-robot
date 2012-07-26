var pomelo = {};
pomelo.users = {};
pomelo.entitys = {};
pomelo.isDead = false;
pomelo.attackId = 0;
pomelo.level = 1;

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
        pomelo.level = player.level;
        robot.pushMessage({route:"area.playerHandler.enterScene", uid:pomelo.uid, playerId: pomelo.playerId, areaId: pomelo.areaId});
        msgTempate.uid = pomelo.uid;
        msgTempate.playerId = pomelo.playerId;
        msgTempate.from = pomelo.player.name,
        msgTempate.areaId = pomelo.areaId;
        robot.interval(move,1000+Math.round(Math.random()*3000));
    }
});


robot.on('area.playerHandler.enterScene', function(data){
    //console.log('enter %j',data.data.area); 
    //dataApi.init(data.data);
    pomelo.entitys = data.data.area.entities;
    //console.log('%j',pomelo.entitys);
    //app.init(data.data);
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
    //console.log("新用户加入: " + JSON.stringify(data));
    pomelo.users[data.player.id] = data.player;
    pomelo.entitys[data.player.entityId] = data.player;
    if (data.player.id===pomelo.playerId) {
        pomelo.entityId = data.player.entityId;
    }
});

/**
 * 处理用户攻击请求
 */
robot.on('onAttack',function(data){
    //console.log("fighting: " + JSON.stringify(data));
    if (data.result.result === 2) {
        //console.log("fighting: " + JSON.stringify(data));
        var attackId = parseInt(data.attacker);
        var targetId = parseInt(data.target);
        var selfId = parseInt(pomelo.entityId);
        if (attackId === selfId || targetId === selfId) {
            if (targetId !== selfId){
                pomelo.attackId = 0;
                pomelo.isDead = false;
                console.error(' oh fuck done by self ' + pomelo.uid + ' ' + targetId);
                delete pomelo.entitys[data.target];
            }
            if (targetId === selfId) {
                pomelo.isDead = true;
                pomelo.attackId = 0;
                console.error('oh,my god,self died %j %j',pomelo.playerId,pomelo.uid);
            }
        } else {
            if (targetId === pomelo.attackId) {
                pomelo.attackId = 0;
                console.error(' oh fuck by other ' + pomelo.uid + ' ' + targetId);
            }
            delete pomelo.entitys[data.target];
        }
    }
});


robot.on('onRevive', function(data){
    if (data.entityId === pomelo.entityId) {
        pomelo.isDead = false;
        console.log(' ON revive %j',pomelo.playerId + ' ' + pomelo.uid);
    }
});


robot.on('onUpgrade' , function(data){
    if (data.player.playerId===pomelo.playerId)
    {   msgTempate.content = 'NB的我升'+data.player.level+'级了，羡慕我吧';
	      pomelo.level = data.player.level;    
        robot.pushMessage(msgTempate);}
});


robot.on('onDropItems' , function(data) {
	  var items = data.dropItems;
	  for (var i = 0; i < items.length; i ++) {
        var item = items[i];
        pomelo.entitys[item.entityId] = item;
    }
});

/*
 *
 */

robot.on('onAddMob', function(data){
    //console.log('on addMob %j',data);
    pomelo.entitys[data.mob.entityId] = data.mob
		//area.addEntity(mob);
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
    //if (data.entityId ===pomelo.playerId) return;
    var entity = pomelo.entitys[data.entityId];
    if (!entity) {
        entity = {};
        entity.entityId = data.entityId;
        entity.type = 'mob';
        //console.error('can not find entity %j ',data);
        //return
    };
    var length = data.path.length;
    entity.x = data.path[length-1].x;
    entity.y = data.path[length-1].y;
    //console.log(' entity find ' + entity.entityId);
    pomelo.entitys[data.entityId] = entity;    
});

var move = function(){
    //console.log(pomelo.isDead + ' ' + pomelo.uid + ' ' + pomelo.playerId + ' ' + pomelo.entityId);
    //console.log(!pomelo.entityId + ' ' + pomelo.isDead);
    if (!pomelo.entityId || pomelo.isDead ) return;
    
    if (pomelo.attackId>0) {
        //console.log('attack target %j',pomelo.attackId)
        var entity = pomelo.entitys[pomelo.attackId];
        if (!!entity) {
            console.log(' first fight ' + entity.type);
            attack(entity);
        }
    } else {
        var nearstId = 0;
        var nearEntity = null;
        var max = Number.MAX_VALUE;
        for (var id in pomelo.entitys){
            var entity = pomelo.entitys[id];
            if (!entity) continue;
            if (entity.type === 'player' || entity.type==='npc') continue;
            if (entity.entityId === pomelo.entityId) {continue;}
            if (entity.type==='mob' && entity.level>pomelo.level) {continue;}
            var ex = entity.x;
            var ey = entity.y;
            var distance = (pomelo.player.x -ex) * (pomelo.player.x -ex) + (pomelo.player.y - ey) *  (pomelo.player.y - ey);
            if (distance<max){
                max = distance; 
                nearstId = id;
                nearEntity = entity;
            }
	      }
        //console.error('attack target %j,self %j,selfuid %j',nearstId,pomelo.entityId,pomelo.uid);
        if (nearstId<=0) {return;}
        if (nearEntity.type==='mob') {
            msgTempate.content = '老子要去杀怪了';
		        robot.pushMessage(msgTempate);
        }
        console.log(' first fight ' + nearEntity.type);
        attack(nearEntity);
    }
};




attack = function(entity) {
    console.log(pomelo.isDead + ' ' + pomelo.uid + ' ' + pomelo.playerId + ' ' + pomelo.entityId + entity.entityId + ' ' + entity.type);
    if (entity.type === 'player' || entity.type === 'mob') {
				if (entity.died) {return;}
        var attackId = entity.entityId;
        pomelo.attackId = attackId;
        var skillId = 1;
        var route = 'area.fightHandler.attack';
        var areaId = pomelo.areaId;
        robot.pushMessage({route:route,areaId:areaId,playerId: pomelo.playerId, targetId:attackId, skillId: skillId});
        //console.log(' begin attack %j , %j %j',pomelo.entityId,attackId,pomelo.uid); 
		} else if (entity.type === 'npc') {
				//pomelo.pushMessage({route:'area.playerHandler.npcTalk', areaId :areaId, playerId: playerId, targetId: targetId});
		} else if (entity.type === 'item' || entity.type === 'equipment') {
        var route = 'area.playerHandler.pickItem';
        var attackId = entity.entityId;
        robot.pushMessage({route:route, areaId:pomelo.areaId, playerId:pomelo.playerId, targetId:attackId});
		}
}


robot.on('onPickItem', function(data){
    if (data.item === pomelo.attackId) pomelo.attackId=0;
    var item = pomelo.entitys[data.item];
    delete item;
    //console.log('pic %j',data);
    if (data.player===pomelo.entityId) {
        msgTempate.content = '捡到一个XXOO的'+ item.kindName+'玩意';
        robot.pushMessage(msgTempate);
    }
});

