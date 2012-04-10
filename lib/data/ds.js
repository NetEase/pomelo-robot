var queryHero = require('./mysql').queryHero;

queryHero(50,function(error,users){
	console.log(users);
});

var last = 500;

genHero(500,600,function(error,users){
	//console.log(error + '' + users);
});