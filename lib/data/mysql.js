var Client = require('mysql').Client;
var client = new Client();

client.host = '192.168.130.107';
client.user = 'xy';
client.password = 'dev';
client.database = 'Pomelo';
 
queryHero = function(max,cb){
  var users = [];
  if (max>99999) {
	  console.error('too large max list reset to default 9999: ');
	  max = 9999;
  }
  client.query('SELECT * FROM Hero',
    function selectCb(error, results, fields) {
      if (error) {
          console.log('queryHero Error: ' + error.message);
          cb(null,users);
      }
      
      for (var i = 0;i<results.length;i++) {
    	  if (i>=max) break;
     	  var user = {username:results[i]['username'],passwd:results[i]['passwd']||'123'};
    	  users.push(user);
      }
      cb(null,users);
  });
};

exports.queryHero = queryHero;