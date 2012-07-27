var pomelo = {};
pomelo.player = null;
pomelo.players = {};
pomelo.entities = {};
pomelo.isDead = false;
pomelo.attackId = 0;
pomelo.bags = [];
pomelo.equipments = [];
pomelo.areas = [];
pomelo.skills = [];

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
        pomelo.player = player;
        robot.pushMessage({route:"area.playerHandler.enterScene", uid:pomelo.uid, playerId: pomelo.player.id, areaId: pomelo.player.areaId});
        msgTempate.uid = pomelo.uid;
        msgTempate.playerId = pomelo.player.id;
        msgTempate.from = pomelo.player.name,
        msgTempate.areaId = pomelo.player.areaId;
        robot.interval(move,1000+Math.round(Math.random()*3000));
    }
});


robot.on('area.playerHandler.enterScene', function(data){
    //console.log('enter %j',data.data); 
    //dataApi.init(data.data);
    var area = data.data.area;
    pomelo.areas[area.id] = area;
    pomelo.entities = data.data.area.entities;
    //console.log('%j',pomelo.entities);
    //app.init(data.data);
});

/**
 * 处理在线用户请求
 */
robot.on('area.userHandler.getOnlinePlayers',function(data){
	  //console.log(' getOnline Players data ' + JSON.stringify(data));
	  _players = data.result;
    for(var key in _players){
        if(_players[key].uid == _uid){
            delete _players[key];
            break;
        }
    }
});

/**
 * 处理用户离开请求
 */
robot.on('onUserLeave',function(data){
    console.log("用户离开: " + JSON.stringify(data));
    var player = pomelo.players[data.playerId];
    if (!!player) {
      clearAttack(player.entityId);
      delete pomelo.entitys[player.entityId]
      delete pomelo.players[data.playerId];
    }
});


var SlimPlay = function(id,entityId,name,type,level){
    this.id = id;
    this.entityId = entityId;
    this.name = name;
    this.type = type;
    this.level = level;
}
/**
 * 处理用户加入请求
 */
robot.on('onPlayerAdd',function(data){
    //console.log("新用户加入: " + JSON.stringify(data));
    if (data.player.id===pomelo.player.id) {
        pomelo.player.entityId = data.player.entityId;
        pomelo.bags = data.player.bag.items;
        pomelo.equipments = data.player.equipments;
        pomelo.skills = data.player.fightSkills;
    }
    var player = data.player;
    var slim = new SlimPlay(player.id,player.entityId,player.name,player.level);
    pomelo.players[data.player.id] = slim;
    pomelo.entities[data.player.entityId] = slim;
    data = null;
    //console.log(' my bags %j %j',pomelo.bags,data.player);
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
        var selfId = parseInt(pomelo.player.entityId);
        if (attackId === selfId || targetId === selfId) {
            if (targetId !== selfId){
                pomelo.attackId = 0;
                pomelo.isDead = false;
                //console.error(' oh fuck done by self ' + pomelo.uid + ' ' + targetId);
                delete pomelo.entities[targetId];
            }
            if (targetId === selfId) {
                pomelo.isDead = true;
                pomelo.attackId = 0;
                //console.error('oh,my god,self died %j %j',pomelo.player.playerId,pomelo.uid);
            }
        } else {
            if (targetId === pomelo.attackId) {
                pomelo.attackId = 0;
                //console.error(' oh fuck by other ' + pomelo.uid + ' ' + targetId);
            }
            delete pomelo.entities[targetId];
        }
    }
});


robot.on('onRevive', function(data){
    if (data.entityId === pomelo.player.entityId) {
        pomelo.isDead = false;
        pomelo.attackId = 0;
        console.log(' ON revive %j',pomelo.player.id + ' ' + pomelo.uid);
    }
});


robot.on('onUpgrade' , function(data){
    if (data.player.id===pomelo.player.id)
    {   msgTempate.content = 'NB的我升'+data.player.level+'级了，羡慕我吧';
	      pomelo.level = data.player.level;    
        robot.pushMessage(msgTempate);}
});


robot.on('onDropItems' , function(data) {
	  var items = data.dropItems;
	  for (var i = 0; i < items.length; i ++) {
        var item = items[i];
        pomelo.entities[item.entityId] = item;
    }
});

/*
 *
 */

robot.on('onAddMob', function(data){
    //console.log('on addMob %j',data);
    var mob = data.mob;
    var slim = new SlimPlay(mob.id||0,mob.entityId,mob.name||'mob',mob.level);
    pomelo.entities[mob.entityId] = slim; 
		//area.addEntity(mob);
    data = null;
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
    var entity = pomelo.entities[data.entityId];
    if (!entity) {
        entity = {};
        entity.entityId = data.entityId;
        entity.type = 'mob';
        //console.error('can not find entity %j ',data);
        //return
    };
    //var length = data.path.length;
    //entity.x = data.path[length-1].x;
    //entity.y = data.path[length-1].y;
    //console.log(' entity find ' + entity.entityId);
    pomelo.entities[data.entityId] = entity;    
});

var getEntityLength =function (entities) {
    var count=0;
    for (var id in entities) {
        count++;
    }
    return count;
};

var move = function(){
    //console.log(pomelo.isDead + ' ' + pomelo.uid + ' ' + pomelo.player.entityId);
    console.log(pomelo.isDead + ' ' + pomelo.uid + ' ' + pomelo.player.entityId + ' ' + pomelo.attackId);
    //console.log(!pomelo.player.entityId + ' ' + pomelo.isDead);
    if (!pomelo.player.entityId || !!pomelo.isDead ) {
        //console.log(pomelo.isDead + ' ' + pomelo.uid + ' ' + pomelo.player.entityId + ' ' + pomelo.attackId);
        return;
    }
    if (pomelo.attackId>0) {
        var entity = pomelo.entities[pomelo.attackId];
        if (!!entity) {
            //console.log(' second fight ' + entity.type);
            attack(entity);
        }
    } else {
        var nearstId = 0;
        var nearEntity = null;
        var size =  getEntityLength(pomelo.entities); 
        //var max = Number.MAX_VALUE;
        var randomNum = Math.floor(Math.random()*size);
        var count = 0;
        //console.log(' first fight ' + nearEntity.type +  ' random ' + randomNum + ' size ' + size);
        for (var id in pomelo.entities){
            var entity = pomelo.entities[id];
            if (entity.type==='npc' || entity.type==='player') continue;
            if (entity.entityId === pomelo.player.entityId) {continue;}
            //if (entity.type==='mob' && entity.level>pomelo.level) {continue;}
            if (count>=randomNum) {
                nearstId = id;
                nearEntity = entity ;
                break;
            } 
            count++;
            //var ex = entity.x;
            //var ey = entity.y;
            //var distance = (pomelo.player.x -ex) * (pomelo.player.x -ex) + (pomelo.player.y - ey) *  (pomelo.player.y - ey);
            //if (distance<max){
            //    max = distance; 
            //    nearstId = id;
            //    nearEntity = entity;
            //}
	      }
        //console.error('attack target %j,self %j,selfuid %j',nearstId,pomelo.entityId,pomelo.uid);
        if (nearstId<=0) {return;}
        if (nearEntity.type==='mob') {
            msgTempate.content = '老子要去杀怪了';
		        robot.pushMessage(msgTempate);
        }
        //console.log(' first fight ' + nearEntity.type +  ' random ' + randomNum + ' size ' + size);
        attack(nearEntity);
    }
};




attack = function(entity) {
    //console.log(pomelo.isDead + ' ' + pomelo.uid + ' ' + pomelo.playerId + ' ' + entity.entityId + ' ' + entity.type);
    if (entity.type === 'player' || entity.type === 'mob') {
				if (entity.died) {return;}
        var attackId = entity.entityId;
        pomelo.attackId = attackId;
        var skillId = 1;
        var route = 'area.fightHandler.attack';
        var areaId = pomelo.player.areaId;
        var msg = {route:route,areaId:areaId,playerId: pomelo.player.id, targetId:attackId, skillId: skillId};
        robot.pushMessage(msg);
        //console.log(' begin attack == %j , %j ',entity.type,msg); 
		} else if (entity.type === 'npc') {
				//pomelo.pushMessage({route:'area.playerHandler.npcTalk', areaId :areaId, playerId: playerId, targetId: targetId});
		} else if (entity.type === 'item' || entity.type === 'equipment') {
        var route = 'area.playerHandler.pickItem';
        var attackId = entity.entityId;
        var msg = {route:route, areaId:pomelo.player.areaId, playerId:pomelo.player.id, targetId:attackId};
        //console.log(' begin pickup == %j , %j ',entity.type,msg); 
        robot.pushMessage(msg);
		}
}

/*
 *ITEM ACTION
 *
 */
robot.on('onPickItem', function(data){
    clearAttack(data.item);
    var item = pomelo.entities[data.item];
    delete item;
    //console.log('pic %j',data);
    if (data.player===pomelo.player.entityId) {
        msgTempate.content = '捡到一个XXOO的'+ item.kindName+'玩意';
        robot.pushMessage(msgTempate);
    }
});

robot.on('onRemoveItem', function(data){
    clearAttack(data.entityId);
    delete pomelo.entities[data.entityId];
});

clearAttack = function(entityId){
    if (entityId===pomelo.attackId) {
        pomelo.attackId = 0;
    }
}