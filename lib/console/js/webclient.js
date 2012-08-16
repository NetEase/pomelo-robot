// WebClient is instantiated by a browser.  It contains the socket connection,
// as well as Node, Stream, and Histories pools.
var _node = {Node: Node};

var WebClient = function(io) {
  this.nodes = {};
  this.ids = {};
  this.streams = {};
  this.count = 0;
  this.histories = {};
  this.stats = {
    messages: 0,
    nodes: 0,
    start: new Date()
  };
  this.connected = false;
  var wc = this;

  // Create socket
  //alert(window.location.hostname);
  this.socket = io.connect('http://'+window.location.hostname+':8888');

  // Register connect callback
  this.socket.on('connect', function() {
    wc.connected = true;
    wc.socket.emit('announce_web_client');
    //wc.socket.emit('message',{method:'getNode',body:[]});
  });
  var isInited = false;
  // Add a new Node to pool
  this.socket.on('add_node', function(message) {
  	console.log(JSON.stringify(message));
  	var nodeId = message.nodeId;
  	var iport = message.iport;
  	//for (var id in message.logs) {
  		if (!wc.ids[nodeId]){
  			wc.add_node(nodeId,iport);
  			wc.ids[nodeId] = nodeId;
  			showUI('block');
  		} else {
  			console.log('duplicated server add ' + nodeId);
  		}
  	//}
  	//console.log(JSON.stringify(wc.ids));
  });
  
  // Remove Node from pool
  this.socket.on('remove_node', function(message) {
    wc.remove_node(message.node);
  });
  //report status
  this.socket.on('webreport', function(message) {
  	doReport(message);
  });
  
  this.socket.on('statusreport', function(message) {
  	var conf = message.conf;
  	var nodeId = message.id;
  	var time = message.time;
  	var hit = $("#hitdiv").html();
  	if (time>=Math.round(conf.maxuser/conf.time)){
  		if (hit.indexOf(nodeId)==-1) {
  			hit+='&nbsp;&nbsp;' + '节点' + nodeId + '完成';
  		}
  		hit = hit.replace('运行中','');
  	} 
  	//var data = {agent:agent,maxuser:maxuser,time:time,robot:robot};
  	$("#hitdiv").html(hit);
  	$("#agentinput").val(conf.agent);
		$("#maxuserinput").val(conf.maxuser);
		$("#robotinput").val(conf.robot);
  });
  
  // Render history response to screen
  // Update total message count stats
  this.socket.on('stats', function(message) {
    if (!wc.stats.message_offset) {
      wc.stats.message_offset = message.message_count;
    }
    wc.stats.messages = message.message_count - wc.stats.message_offset;
  });

};

var first = true;

function average (arr) {
	if (!arr || _.size(arr)<=0) {return 0;}else {
	return Math.round(_.reduce(arr, function(memo, num) {
		return memo + num;
	}, 0) / arr.length);
	}
}

function calcQs(avg,count) {
	if (avg <=0 ) {return 0;} 
	else {
		return Math.round(1000/avg*count);
	}
}

var sumpagesize = 0,summaxsize = 0,singlemaxsize = 0, singlepagesize = 0,times = 0;

function reCalcSize(){
	summaxsize = $('#maxuserinput').val()*$('#agentinput').val();
  sumpagesize = summaxsize;	
  singlemaxsize = $('#maxuserinput').val();
	singlepagesize = singlemaxsize;
}

var dcolumns = [];

function reCalcColumn(message){
	 dcolumns = [];
	_.each(message,function(val,key){
		var keycolumns = [];
		var maxId = 0;
		var firstval = val;
		_.each(firstval,function(kval,akey){
			var _length = _.size(kval);
			if (_length>maxId) maxId = _length;
			if (_length>0) keycolumns.push(akey);
		});
		_.each(keycolumns,function(dkey){ if (_.indexOf(dcolumns,dkey)===-1) dcolumns.push(dkey); });	
	});
	return dcolumns;
}
/**
 * 
 */
function getGlobalQsRows(gavgrows){
	var gqsrows = [];
	for (var index = 0;index<gavgrows.length;index++){
		var _avgrows = gavgrows[index];
		var _user = _avgrows[0];
		var _qsrows = [];
		_qsrows.push(_user);
		for(var j = 1;j<_avgrows.length;j++){
			_qsrows.push(calcQs(_avgrows[j],_user));
		}
		gqsrows.push(_qsrows);
	}
	return gqsrows;
}

function getGlobalAvgData(message){
	var gavgdata = {};
	_.each(dcolumns,function(dkey){
		for (var agentId in message){
			var agentData = message[agentId];
				var sdata = agentData[dkey] || [];
				if (!gavgdata[dkey]) gavgdata[dkey] = [];
				if (!!gavgdata[dkey]){
					var _edata = gavgdata[dkey];
					_.each(sdata,function(ele){ _edata.push(ele); });
				} else {
					gavgdata[dkey] = sdata.slice();
				};
	}});
	return gavgdata;
}

function getGlobalAvgRows(gavgdata){
	var gavgrows = [];
	for (var index = 0;index<times;index++){
		var __rows = [];
		__rows.push((index+1));
		_.each(dcolumns,function(dkey){
			var __row = 	[gavgdata[dkey][index]] || [0];
			__rows.push(average(__row));
		});
		gavgrows.push(__rows);
	};
	return gavgrows;
};

function calcTimes(gavgdata){
	_.each(gavgdata,function(davg,dkey){ times = _.size(davg); return ; });
}


function getGlobalSummary(globalSumDatas){
	var gsummary = {};
	_.each(globalSumDatas,function(gval,gkey){
		var _gmin = _.min(gval);
		var _gmax = _.max(gval);
		var _gavg = average(gval);
		var _gqs =calcQs(_gavg,summaxsize);
		var _gsize = gval.length;
		var summary = {'max':_gmax,'min':_gmin,'avg':_gavg,'qs':_gqs,'size':_gsize};
		gsummary[gkey] = (summary);
	});
	return gsummary;
}

function getDetailSummary(agentSumDatas){
	var detailAgentSummary = {};
	_.each(agentSumDatas,function(data,agentKey){
		 var __agentqsrows = {};
		_.each(data,function(actData,actKey){
			var _gmin = _.min(actData);
			var _gmax = _.max(actData);
			var _gavg = average(actData);
			var _gqs = calcQs(_gavg,singlemaxsize);
			var _gsize = actData.length;
			var summary = {'max':_gmax,'min':_gmin,'avg':_gavg,'qs':_gqs,'size':_gsize};
			__agentqsrows[actKey] = (summary);
		});
		detailAgentSummary[agentKey] = __agentqsrows;
	});
	return detailAgentSummary;
}

function getDetailRows(gcolumns,agentDetailDatas,detailAgentAvg,detailAgentQs){
	_.each(agentDetailDatas,function(ddata,agentKey){
		var __agentavgrows = [];
		var __agentqsrows = [];
		for (var index = 0;index<times;index++){
			var __avgrows = [];
			var __qsrows = [];
			var uesrCount = (index+1); 
			__avgrows.push(uesrCount);
			__qsrows.push(uesrCount);
			_.each(dcolumns,function(dkey){
				var __row = 	ddata[dkey][index] ||[0];
				var __rowavg = average([__row]);
				__avgrows.push(__rowavg);
				__qsrows.push(calcQs(__rowavg,uesrCount));
			});
			__agentavgrows.push(__avgrows);
			__agentqsrows.push(__qsrows);
		};
		var everyavgreport = {};
		everyavgreport['uid']='avg' + agentKey;
		everyavgreport['rows'] = __agentavgrows;
		everyavgreport['columns'] = gcolumns;
		detailAgentAvg.push(everyavgreport);
		
		var everyqsreport = {};
		everyqsreport['uid'] = 'qs' + agentKey;
		everyqsreport['rows'] = __agentqsrows;
		everyqsreport['columns'] = gcolumns;
		detailAgentQs.push(everyqsreport);
	});
}

function mergeDatas(message,globalSumDatas,agentSumDatas,agentDetailDatas){
	_.each(dcolumns,function(dkey){
		_.each(message,function(val,agentId){
			//_.each(val,function(sval){
				var sdata = val[dkey] || [];
					if (!!globalSumDatas[dkey]){
						var _egdata = globalSumDatas[dkey];
						_.each(sdata,function(ele){_egdata.push(ele);});
					} else {
						globalSumDatas[dkey] = sdata.slice();
					}
					if (!agentSumDatas[agentId]) agentSumDatas[agentId] = {};
					if (!!agentSumDatas[agentId][dkey]){
						var _edata = agentSumDatas[agentId][dkey];
						_.each(sdata,function(ele){ _edata.push(ele); });
					} else {
						agentSumDatas[agentId][dkey] = sdata.slice();
					};
					if (!agentDetailDatas[agentId]) agentDetailDatas[agentId] = {};
					if (!agentDetailDatas[agentId][dkey]){agentDetailDatas[agentId][dkey]=[];};
					_.each(sdata,function(ele){agentDetailDatas[agentId][dkey].push(ele)});
			//});
		});
	});
}

function getGlobalColumns(){
	var gcolumns = [];
	gcolumns.push('users');
	_.each(dcolumns,function(dkey){ gcolumns.push(dkey); });
	return gcolumns;
}
function doReport(message){
	
	reCalcSize();
	reCalcColumn(message);

	var globalSumDatas = {};
	var agentSumDatas = {};
	var agentDetailDatas = {};
	mergeDatas(message,globalSumDatas,agentSumDatas,agentDetailDatas);
	
	var gavgdata = getGlobalAvgData(message);
	calcTimes(gavgdata);
	
	var gcolumns = getGlobalColumns();
	
	var gavgrows = getGlobalAvgRows(gavgdata);
	var gqsrows = getGlobalQsRows(gavgrows);
	var gsummary = getGlobalSummary(globalSumDatas);

	var globaldata = [];
	var greport = {};
	greport['summary'] = gsummary;
	
	var gavgreport = {};
	gavgreport['uid']='avg';
	gavgreport['rows'] = gavgrows;
	gavgreport['columns'] = gcolumns;
	greport['avg'] = gavgreport;
	
	var gqsreport = {};
	gqsreport['uid']='qs';
	gqsreport['rows'] = gqsrows;
	gqsreport['columns'] = gcolumns;
	greport['qs'] = gqsreport;
	
	globaldata.push(greport);
	
	/**
	 * below deal with detail agent data
	 */
	var detailAgentSummary = getDetailSummary(agentSumDatas);
	var detailAgentAvg = [];
	var detailAgentQs = [];
	getDetailRows(gcolumns,agentDetailDatas,detailAgentAvg,detailAgentQs);
	
	if (times>0) {
		update(globaldata);
		updateDetailAgent(detailAgentSummary);
		updateAvgAgent(detailAgentAvg);
		updateEveryAgent(detailAgentQs,'qs_div','吞吐率图表');
	}
	
}

function showUI(value){
	//$("#run-button").css('display',value);
	//$("#runcode-button").css('display',value);
	//$("#codeinput").css('display',value);
}

WebClient.prototype = {
  // Add a new Node to pool
  add_node: function(nodeId,iport) {
    var node = new _node.Node(nodeId,iport,this);
    node.render();
    var nodeId = nodeId;
    this.nodes[nodeId] = node;
    this.stats.nodes++;
    if (this.stats.nodes>=parseInt($('#agentinput').val())){
    	$('#ready-button').val('准备完成');
    	$('#run-button').show();
    } else {
    	$('#ready-button').val('整备中');
    	$("#run-button").css('display','none');
    }
  },

  // Remove Node from pool
  remove_node: function(nodeId) {
    var node = this.nodes[nodeId];
    if (!!node) {
    	node.destroy();
    	delete this.nodes[node.nodeId];
    }
    this.stats.nodes--;
    if (this.stats.nodes<=0){
    	showUI('none');
    	this.stats.nodes = 0;
    }
    delete this.ids[nodeId];
  },

  // Render all LogFiles & Stream/History screens
  // Useful for screen open/closing
  rerender: function() {
    _(this.nodes).each(function(node, nlabel) {
      _(node.log_nodes).each(function(log_file, llabel) {
        log_file.render();
      });
    });
  },
  // Resize screens, defined in web_client.jquery.js
  resize: function() { throw Error("WebClient.resize() not defined"); },
 
};

// Export for nodeunit tests
try {
  exports.WebClient = WebClient;
} catch(err) {
	
};
