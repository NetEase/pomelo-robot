var Machine = require('../lib/agent/machine').Machine;

var app = {host:'127.0.0.1',port:3050};

var user = {username:'xcc4',passwd:'123'};

var machine = new Machine(app,user);

machine.run();
