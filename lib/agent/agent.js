var __ = require('underscore');
var io = require('socket.io-client');
var logging = require('../common/logging').Logger;
var Machine = require('./machine').Machine;
var monitor  = require('../monitor/monitor');

var STATUS_INTERVAL = 60 * 1000; // 60 seconds
var RECONNECT_INTERVAL = 15 * 1000; // 15 seconds
var HEARTBEAT_PERIOD = 30 * 1000; // 30 seconds
var HEARTBEAT_FAILS = 5; // Reconnect after 3 missed heartbeats

var Agent = function(conf) {
    this.log = logging;
    this.conf = {};
    this.conf.master = conf.master;
    this.conf.encoding = 'utf8';
    this.conf.message_type = 'log';
    this.conf.status_frequency =  STATUS_INTERVAL;
    this.last_heartbeat = null;
    this.messages_sent = 0;
    this.connected = false;
    this.reconnecting = false;
    var agent = this;
	  this.conf.debug = conf.debug || true;
	  this.conf.apps = conf.apps;
    this.conf.data = conf.data;
    this.appLength = conf.apps.length;
	  this.nodeId = conf.nodeId;
	  this.dataCount = __.size(agent.conf.data);
	  this.pageSize = conf.pageSize || 1;
	  this.pageCount = this._dataCount/this.pageSize;
	  this.pageCur = 1;
    this.count = 0;
	  this.machines = [];
};

Agent.prototype = {

    // Create socket, bind callbacks, connect to server
    connect: function() {
        var agent = this;
        var uri = agent.conf.master.host + ":" + agent.conf.master.port;    
        agent.socket = io.connect(uri);

        agent.socket.on('error', function(reason) {
            agent.reconnect();
        });

        // Register announcement callback
        agent.socket.on('connect', function() {
            agent.log.info("Connected to server, sending announcement...");
            agent.announce();
            agent.connected = true;
            agent.reconnecting = false;
            agent.last_heartbeat = new Date().getTime();
        });
        agent.socket.on('disconnect', function() {
            agent.socket.disconnect();
            agent.log.error("Exiting.");
            process.exit(1);
        });

        // Server heartbeat
        agent.socket.on('heartbeat', function() {
            //agent._log.info("Received server heartbeat");
            agent.last_heartbeat = new Date().getTime();
            return;
        });

        // Node with same label already exists on server, kill process
        agent.socket.on('node_already_exists', function() {
            agent.log.error("ERROR: A node of the same name is already registered");
            agent.log.error("with the log server. Change this agent's instance_name.");
            agent.log.error("Exiting.");
            process.exit(1);
        });
        //begin to run
        agent.socket.on('run', function(message) {
            agent.code = message.robot;
            agent.pageCur = 1;
            agent.run();
        });
    },
    
    run:function(){
        var agent = this;
        agent.runusers = agent.conf.data.slice(0,this.pageCur * this.pageSize);
        this._count = __.size(agent.runusers);
        agent.log.info(this.nodeId + ' run with ' + __(agent.runusers).size() + ' robots,times:' + this.pageCur);
        monitor.clear();
        var machines = [];
        for (var index in agent.runusers) {
    	      var obj = agent.runusers[index];
    	      var app = agent.conf.apps[index%agent.appLength];
            var machine = new Machine(app,obj,agent.code);
			      machine.on('done',function(msg){
				        agent.check();
			      });
			      machines.push(machine);
		    };
		    agent.machines = machines;
  	    __.each(machines,function(ele){ele.run();});
    },
    
    close:function(){
  	    var agent = this;
  	    this._count = __.size(agent.runusers);
  	    __.each(agent.machines,function(ele){ele.socket.disconnect();});
  	    agent.pageCur++;
  	    //console.log('close ' + agent._nodeId + ' agent.times ' + agent.pageCur + ' ' + agent.pageCount);
  	    if (agent.pageCount>=agent.pageCur){
  		      agent.run();
  	    }
    },

    check: function() {
        var agent = this;
        this._count--;
        //console.error('this._counthis._counthis._coun ' + this._count)
        if (this._count==0){
			      //console.log('machine done report');
			      //process.exit();
    	      var d = monitor.getData();
    	      //console.log('check ' + agent._nodeId + ' agent.times ' + agent.pageCur + ' ' + agent.pageCount);
			      agent.socket.emit('report',{id:agent.pageCur,data:d});
			      agent.close();
			      
        };
    },
    
    // Run log agent
    start: function() {
        var agent = this;
        agent.connect();
        // Check for heartbeat every HEARTBEAT_PERIOD, reconnect if necessary
        setInterval(function() {
            var delta = ((new Date().getTime()) - agent.last_heartbeat);
            if (delta > (HEARTBEAT_PERIOD * HEARTBEAT_FAILS)) {
                agent.log.warn("Failed heartbeat check, reconnecting...");
                agent.connected = false;
                agent.reconnect();
            }
        }, HEARTBEAT_PERIOD);
    },
    // Sends announcement to LogServer
    announce: function() {
  	    var agent = this;
  	    //console.log(require('util').inspect(agent.socket,true,100,100));
        this._send('announce_node', {
            client_type:'node',
            nodeId:agent.nodeId
        });
    },

    // Reconnect helper, retry until connection established
    reconnect: function(force) {
        if (!force && this.reconnecting) { return; }
        this.reconnecting = true;
        this.log.info("Reconnecting to server...");
        var agent = this;
        setTimeout(function() {
            if (agent.connected) { return; }
            agent.connect();
            setTimeout(function() {
                if (!agent.connected) {
                    agent.reconnect(true);
                }
            }, RECONNECT_INTERVAL/2)
        }, RECONNECT_INTERVAL);
    },

    // Sends message to LogServer, gracefully handles connection failure
    _send: function(event, message) {
        try {
            this.socket.emit(event, message);
            // If server is down, a non-writeable stream error is thrown.
        } catch(err) {
            this.log.error("ERROR: Unable to send message over socket.");
            this.connected = false;
            this.reconnect();
        }
    }
};

exports.Agent = Agent;
