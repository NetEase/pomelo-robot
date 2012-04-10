var queryHero = require('./mysql').queryHero;

queryHero(50,function(error,users){
	console.log(users);
});

