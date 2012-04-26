var monitor = module.exports;

var dataMap = {};

var limit = 1000;

monitor.getData = function(){
  return dataMap;
};

monitor.clear = function(){
	dataMap = {};
};

monitor.beginTime = function(route,uid,time){
  if(!dataMap[route])
    dataMap[route] = buildRouteData();
  
  if(!dataMap[route][uid])
    dataMap[route][uid] = buildUserData();
  
  var udata = dataMap[route][uid];
  
  udata.start.push(time);

}; 


monitor.endTime = function(route,uid,time){
	if(!dataMap[route])
    dataMap[route] = buildRouteData();
	
  if(!dataMap[route][uid])
    dataMap[route][uid] = buildUserData();
  var udata = dataMap[route][uid];
  udata.end.push(time);

};




function buildRouteData(){
  var data = {};
  return data;
}

function buildUserData(){
  var data = {};
  data.start = [];
  data.end = [];
  return data;
}