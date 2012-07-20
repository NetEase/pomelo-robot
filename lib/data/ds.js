var config = require('../config/config');

var mysql =config['dev'].mysql;

var Client = require('mysql').Client;
var client = new Client();
client.host = mysql.host;
client.user = mysql.user;
client.password = mysql.password;
client.database = mysql.database;

var queryHero = require('./mysql').queryHero;

queryHero(client,50,0,function(error,users){
	//console.log(users);
});
var i = 1;
var max = 10;
genHero(client,'pomelo',max,function(error,users){
	//console.log(error + '' + users);
    i++;
    if (i>=max) {
        console.log(' gen all data done ');
    }
});
