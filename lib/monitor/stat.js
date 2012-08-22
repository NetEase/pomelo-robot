/**
 * stat  receive agent client monitor data
 * merger vaild data that has response
 * when server  restart, it will clear
 *
 *
 */
var __ = require('underscore');
var stat = module.exports;
var _dataMap = {};

stat.getData = function(){
  return _dataMap;
};

stat.merge = function(agent, index,params){
	//var data = _dataMap[agent] || [];
	var result = filter(params, index);
  //120814yph data.push(result);
  _dataMap[agent] = result;//data;
};
/**
 * clear data
 */
stat.clear = function(agent){
	if (!!agent) {
		delete _dataMap[agent];
	} else {
		_dataMap = {};
	}
};


function filter(params,index){
  var data = {};
  __.each(params,function(val,key){
    var times = [];
    __.each(val,function(dval,dkey){
      var ustart = dval.start;
      var uend = dval.end;
      //console.log(dkey + ' ' + __.size(ustart) + '  end ' + __.size(uend) + ' val ' + JSON.stringify(dval));
      if (__.size(ustart)==__.size(uend)){
    		for (var i = 0;i<__.size(ustart);i++){
    			var begin = ustart[i];
    			var end = uend[i];
    			var time = end-begin;
    			if (time>0)
    				times.push(time);
    		};
  		};
  	});
  	data[key] = times;
   });
	//console.log(' val ' + JSON.stringify(data));  
  return data;
};
