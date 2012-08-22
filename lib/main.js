var Agent = require('./agent/agent').Agent;
var Server = require('./master/server').Server;
var HTTP_SERVER = require('./console/http').HTTP_SERVER;

/**
 * export to developer prototype
 * 
 * @param {Object} config
 * include deal with master and agent mode
 * 
 * param include env, agentId, mode
 *
 */
var Robot = function(config){
  this.args = process.argv;
  this.env = 'dev';
  this.agentId = 'agent1';
  this.server = 'master';
  this.config = config;
  this.master =null;
  this.apps = null;
  this.clients = null;
  this.pageSize = 10;
  this.init();
};

/**
 * parse the args
 *
 *
 */
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
  };

  /*
   * run master server
   *
   * @param {String} start up file
   *
   */ 
  Robot.prototype.runMaster = function(startUpFile) {
    var conf = {},agent = null,server;
    if (this.server !== 'master') {throw new Error(' server must be master,it is %j',this.server);}
    conf.env = this.env;
    conf.clients = this.clients;
    conf.main = startUpFile; 
    server = new Server(conf);
    server.listen(this.master.port);
    HTTP_SERVER.start(this.master.webport);
  };

  /**
   * run agent client 
   *
   * @param {Array} data
   * @param {String} script
   *
   */ 
  Robot.prototype.runAgent = function(data,script) {
    conf.data = data;
    conf.master = this.master;
    conf.pageSize = this.pageSize;
    conf.apps = this.apps;
    conf.nodeId = this.agentId;
    conf.script = script;
    agent = new Agent(conf);
    agent.start();
  };

  exports.Robot = Robot;
