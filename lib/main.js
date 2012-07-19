var queryHero = require('./data/mysql').queryHero;
var Agent = require('./agent/agent').Agent;
var config = require('./config/config');
var Server = require('./master/server').Server;

var args = process.argv;
// config
var env = 'dev';
var agentId = 'agent1';
var server = 'master';
var i = 2;
if (args.length > 2){
    env = args[i++];
    server=args[i++];
    agentId = args[i++];
}

console.log(args.length + ' ' +  env + ' ' + server); 

var master = config[env].master;
var app = config[env].app;
var mysql =config[env].mysql;

console.error('%j',mysql);

var Client = require('mysql').Client;
var client = new Client();
client.host = mysql.host;
client.user = mysql.user;
client.password = mysql.password;
client.database = mysql.database;


if (server === 'master') {
 	var server = new Server(env);
	server.listen(master.port);
	var HTTP_SERVER = require('./console/http').HTTP_SERVER;
	HTTP_SERVER.start(master.webport);
} else {
	var limit = args[i++];
	var offset= args[i++];
	var pageSize = args[i++];
	var conf = {};
	queryHero(client,limit,offset,function(error,users){
		app.data = users;
		conf.master = master;
		conf.pageSize = pageSize;
		conf.app = app;
		conf.nodeId = agentId;
		var agent = new Agent(conf);
		agent.start();
	});
}

//process.on('uncaughtException', function(err) {
//	console.error(' Caught exception: ' + err.stack);
//});
