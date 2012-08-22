#pomelo-robot
pomelo-robot is simple tool to benchmark the socket.io server performance.

pomelo-robot can run in multiple mode such as single machine with many process
,distribute test many socket.io server.

pomelo-robot execute developer custom JavaScript in a sand box and static
monitor include max(min,avg) response time and QPS,etc. then report to web http
server with graph display

pomelo-robot also can be used in http benchmark by developer script;  


##Installation
```
npm install pomelo-robot
```

##Usage
``` javascript

var Robot = require('pomelo-robot').Robot;
//developer custom data source with data application
var queryHero = require('./app/data/mysql').queryHero;
//config the master and app,detail by demo 
var config = require('./app/config/config');
var fs = require('fs');

var robot = new Robot(config);

if (robot.server==='master') {
    robot.run(__filename);
} else {
    var mysql =config[robot.env].mysql;
    var Client = require('mysql').Client;
    var client = new Client();
    client.host = mysql.host;
    client.user = mysql.user;
    client.password = mysql.password;
    client.database = mysql.database;
    var args = process.argv;
    var i = 5;
    var limit = args[i++];
    var offset= args[i++];
    //developer execute script
    var script = fs.readFileSync(process.cwd() + '/app/config/lord.js', 'utf8');
    queryHero(client,limit,offset,function(error,users){robot.run(users,script)});
}

``` 

##API
###robot.runMaster()
run master server and http server,then initial server status include
clients,start up file. 
####Arguments
+ startUpFile - The master server auto start up agent file name, default is
  current run file;

###robot.runAgent()
robot run in client agent mode.
####Arguments
+ datasource - The Array data ,and the size is the concurrent users. 
+ script - The developer custom script that agent should be execute. 

###Notice
when pomelo-robot run in distribute mode, every client should be in same
directory path and master could be ssh login automatic. Otherwise developer can
start up agent by self,for the custom script, the demo is attachment.
