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

//console.log(args.length + ' ' +  env + ' ' + server); 

var master = config[env].master;
var apps = config[env].apps;
var mysql =config[env].mysql;
var clients = config[env].clients;

console.error('%j',mysql);

var Client = require('mysql').Client;
var client = new Client();
client.host = mysql.host;
client.user = mysql.user;
client.password = mysql.password;
client.database = mysql.database;

var conf = {};

if (server === 'master') {
    conf.env = env;
    conf.clients = clients;
    var server = new Server(conf);
	  server.listen(master.port);
	  var HTTP_SERVER = require('./console/http').HTTP_SERVER;
	  HTTP_SERVER.start(master.webport);
} else {
	  var limit = args[i++];
	  var offset= args[i++];
	  var pageSize = args[i++];
	  queryHero(client,limit,offset,function(error,users){
		    conf.data = users;
		    conf.master = master;
		    conf.pageSize = pageSize;
		    conf.apps = apps;
		    conf.nodeId = agentId;
		    var agent = new Agent(conf);
		    agent.start();
	  });
}

//process.on('uncaughtException', function(err) {
//	console.error(' Caught exception: ' + err.stack);
//});
