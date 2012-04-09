var util = require('util');

var Listener = function(machine) {
	//this.machine = machine;
	//console.log(util.inspect(machine,false,100,true));
};

Listener.prototype.response = function(msg){
	var self = this;
	debugger;
	console.error('resonpse ' + JSON.stringify(msg));
	if (msg.route==='connector.loginHandler.login' && msg.code==200){
		//console.log(util.inspect(self.machine,true,100,true));
		self.login();
	}
};

exports.Listener = Listener;