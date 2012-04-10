var localVar = 123,
    usingscript, evaled,
    vm = require('vm');
var test = 2;

var util = require('util');


var initSandbox = {
	      animal: 'cat',
	      count: 2,
	      console:console
	    };


var User = function(count) {
	this.count = count;
};


User.prototype.__defineGetter__('xcount',function(){return this.count;});


var user = new User(4);

console.log(user.xcount);

console.log(util.inspect(user,true,100,true));

var context = vm.createContext(initSandbox);

usingscript = vm.runInContext('localVar = 1;console.log(" ds " + count+2);localVar',context,  'myfile.vm');
console.log('localVar: ' + localVar + ', usingscript: ' +  usingscript);
evaled = eval('localVar = 1;');
console.log('localVar: ' + localVar + ', evaled: ' +  evaled);

globalVarx = 0;

var script = vm.createScript('globalVarx += 2', 'myfile.vm');

console.log(globalVarx);

for (var i = 0; i < 1000 ; i += 1) {
  script.runInThisContext();
}

console.trace();

console.log(globalVarx);
