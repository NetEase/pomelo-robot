var Agent = require('./agent/agent').Agent;
var Server = require('./master/server').Server;
var HTTP_SERVER = require('./console/http').HTTP_SERVER;

var Robot = function(config){
	  this.args = process.argv;
	  this.env = 'dev';
	  this.agentId = 'agent1';
	  this.server = 'master';
    this.config = config;
	  this.master =null;
    this.apps = null;
    this.clients = null;
    this.init();
    this.pageSize = 10;
}

Robot.prototype.init = function(){
	  var args = this.args;
    var config = this.config;
	  var i = 2;
	  if (args.length > 2){
	      this.env = args[i++];
	      this.server=args[i++];
	      this.agentId = args[i++];
	  }
	  var env = this.env;
	  this.master = config[env].master;
	  this.apps = config[env].apps;
	  this.clients = config[env].clients;
    if (this.server!=='master') {
        this.pageSize = args[7];
    }
}

Robot.prototype.run = function(data,script) {
	  var conf = {},agent = null,server;
	  if (this.server === 'master') {
	      conf.env = this.env;
	      conf.clients = this.clients;
        conf.main = data;
	      server = new Server(conf);
		    server.listen(this.master.port);
		    HTTP_SERVER.start(this.master.webport);
	  } else {
			  conf.data = data;
			  conf.master = this.master;
			  conf.pageSize = this.pageSize;
			  conf.apps = this.apps;
			  conf.nodeId = this.agentId;
        conf.script = script;
			  agent = new Agent(conf);
			  agent.start();
	  }
}

exports.Robot = Robot;
//process.on('uncaughtException', function(err) {
//	console.error(' Caught exception: ' + err.stack);
//});
