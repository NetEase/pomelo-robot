var cluster = require('cluster');
var Machine = require('./client/machine').Machine;
var Listener = require('./client/listener').Listener;
var util = require('util');
var numCPUs = require('os').cpus().length;
var queryHero = require('./data/mysql').queryHero;

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

queryHero(200,function(error,users){
	for(var i in users) {
		var user = users[i];
		if (user.usrename==='xcc7') continue;
 		var server = {host:'192.168.145.60',port:3050};
		var machine = new Machine(server);
		machine.run(user);
	}
});

