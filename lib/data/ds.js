var queryHero = require('./mysql').queryHero;

queryHero(50,0,function(error,users){
	//console.log(users);
});

genHero('pomelo',12000,function(error,users){
	//console.log(error + '' + users);
});
