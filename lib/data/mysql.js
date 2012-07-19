var Client = require('mysql').Client;
var client = new Client();
var mysql = require('../config/config').mysql;
var dataApi = require('./dataApi');

client.host = mysql.host;
client.user = mysql.user;
client.password = mysql.password;
client.database = mysql.database;

queryHero = function(limit,offset,cb){
    var users = [];
    var sql = 'SELECT User.* FROM User,Player where User.id = Player.userId and User.name like '%pomelo%' limit ? offset ? ';
    var args = [parseInt(limit),parseInt(offset)];
    client.query(sql,args,function selectCb(error, results, fields) {
        if (!!error) {
            console.log('queryHero Error: ' + error.message);
            cb(null,users);
        }
        for (var i = 0;i<results.length;i++) {
      	    var user = {uid:results[i]['id'],username:results[i]['name'],passwd:results[i]['passwd']||'123'};
    	      users.push(user);
        };
        cb(null,users);
    });
};

genHero = function(prefix,max,cb){
    var sql = 'SELECT max(id) as maxid FROM User where 1 = ? ';
    var args = [1];
    client.query(sql,args,function(error,results){
        if (!!error) {
            console.error('select maxId error %j',error);
        } else {
            var beginId = results[0].maxid;
            var password = '123';
            var sceneId = 1,level = 1 , x = 100,y = 100;var _username = prefix,_name=prefix;
            for (var i =  beginId ;i<(beginId+max);i++) {
                var username = _username +  i;
                var name = _name +  i;
                var ids = [1001,1007,1020,1022,1024,1025,1026,1027,1028,1029,1030,1031]
                var sql = 'insert into User (name,password,loginCount,lastLoginTime) values(?,?,?,?)';
	              var loginTime = Date.now();
	              var args = [username, password, 1, loginTime];
		            client.query(sql, args, function(err,res){
			              if(err !== null){
                        console.error('create User error %j',err);
			              } else {
				                var userId = res.insertId;
                        var roleId = ids[Math.round(Math.random()*11)];
                        createPlayer(userId,'pomelo'+userId,roleId,cb);
				                //cb(null,userId);
			              }
		            });
            };
        }});
};



createPlayer = function (uid, name, roleId,cb){
	  var sql = 'insert into Player (userId, kindId, kindName, name, country, rank, level, experience, attackValue, defenceValue, hitRate, dodgeRate, walkSpeed, attackSpeed, hp, mp, maxHp, maxMp, areaId, x, y, skillPoint) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

	  var role = dataApi.role.findById(roleId);
	  var character = dataApi.character.findById(roleId);
	  console.error('%j, %j , %j',uid,roleId,role); 
	  var x = 1230 + Math.round(Math.random()*30);
	  var y = 1165 + Math.round(Math.random()*30);
	  var areaId = 1;
	  role.country = 1;
	  
	  var args = [uid, roleId, role.name, name, role.country, 1, 1, 0, character.attackValue, character.defenceValue, character.hitRate, character.dodgeRate, character.walkSpeed, character.attackSpeed, character.hp, character.mp, character.hp, character.mp, areaId, x, y, 1];

	  client.query(sql, args, function(err,res){
		    if(err !== null){
			      console.error('create player failed! %j ',err);
		    } else {
            console.error(' genate ok ' + name);
            if (!!cb) 
			          cb(null,uid);
		    }
	  });
};


exports.queryHero = queryHero;
exports.genHero = genHero;