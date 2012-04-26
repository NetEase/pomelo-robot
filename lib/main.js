var queryHero = require('./data/mysql').queryHero;
var Agent = require('./agent/agent').Agent;
var config = require('./config/config');
var Server = require('./master/server').Server;

var master = config.master;
var app = config.app;
var args = process.argv;
// config
var env = 'master';
var agentId = 'agent1';

if (args.length > 2){env = args[2]; agentId = args[3];}

if (env==='master') {
 	var server = new Server();
	server.listen(master.port);
	var HTTP_SERVER = require('./console/http').HTTP_SERVER;
	HTTP_SERVER.start(master.webport);
} else {
	var limit = args[4];
	var offset= args[5];
	var pageSize = args[6];
	var conf = {};
	queryHero(limit,offset,function(error,users){
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
