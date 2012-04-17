var queryHero = require('./data/mysql').queryHero;
var Agent = require('./agent/agent').Agent;
var config = require('./config/config');
var Server = require('./master/server').Server;

var master = config.master;
var app = config.app;

//if (cluster.isMaster) {
//  // Fork workers.
//  for (var i = 0; i < numCPUs-1; i++) {
//    cluster.fork();
//  }
//  cluster.on('death', function(worker) {
//    console.log('worker ' + worker.pid + ' died');
//  });
//} else {
//	
//}

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
	var ids = [0,0];
	for(var id in config.agent){
		var af = config.agent[id];
		if (af.id===agentId){
			ids = af.ids;
			break;
		}
	}
	var conf = {};
	queryHero(ids,function(error,users){
		//console.log(env + ' ' + agentId + ' ids ' + JSON.stringify(users));
		app.data = users;
		conf.master = master;
		conf.app = app;
		var agent = new Agent(conf);
		agent.start();
	});

}

process.on('uncaughtException', function(err) {
	console.error(' Caught exception: ' + err.stack);
});