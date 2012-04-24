// WebClient is instantiated by a browser.  It contains the socket connection,
// as well as Node, Stream, and Histories pools.
var _node = {Node: Node};

var WebClient = function(io) {
  this.nodes = {};
  this.ids = {};
  this.streams = {};
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
  	//alert(JSON.stringify(message));
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
  	console.log(message);
  	doReport(message);
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


function average (arr) {
	return Math.round(_.reduce(arr, function(memo, num) {
		return memo + num;
	}, 0) / arr.length);
}

function doReport(message){
var mdata = [];
var _show = false;
var gcolumns = [];
_.each(message,function(val,key){
	var keycolumns = [];
	var maxId = 0;
	_.each(val,function(kval,akey){
		var _length = _.size(kval);
		if (_length>maxId) maxId = _length;
		if (_length>0) keycolumns.push(akey);
	});
	_.each(keycolumns,function(dkey){
			if (_.indexOf(gcolumns,dkey)===-1)
				gcolumns.push(dkey);
		});	
});

var gdata = {};
var gdetail = {};

_.each(gcolumns,function(dkey){
	var count = 0;
	var single = {};
	_.each(message,function(val,agentId){
		var sdata = val[dkey];
		var _smin = _.min(sdata);
		var _smax = _.max(sdata);
		var _savg = average(sdata);
		if (!!gdata[dkey]){
			var _edata = gdata[dkey];
			_.each(sdata,function(ele){
				_edata.push(ele);
			});
		} else {
			gdata[dkey] = sdata;
		};
		var length = sdata.length;
		single['max'] = _smax;
		single['min'] = _smin;
		single['avg'] = _savg;
		single['qs'] = Math.round(1000/_savg);
		single['size'] = length;
		if (!gdetail[agentId]) gdetail[agentId] = {};
		gdetail[agentId][dkey] = single;
	});
});

var greport = {};
var gsummary = {};
var gavgreport = {};
var gqsreport = {};
var gcloumns = [];
var gavgrows = [];
var gqsrows = [];
_.each(gdata,function(gval,gkey){
	var _gmin = _.min(gval);
	var _gmax = _.max(gval);
	var _gavg = average(gval);
	var _gqs = Math.round(1000/_gavg*gval.length);
	var _gsize = gval.length;
	var summary = {'max':_gmax,'min':_gmin,'avg':_gavg,'qs':_gqs,'size':_gsize};
	gsummary[gkey] = (summary);
	gcloumns.push(gkey);
	var _savgrows = [];
	_savgrows.push(_gavg);
	gavgrows.push(_savgrows);
	
	var _sqsrows = [];
	_sqsrows.push(_gqs);
	gqsrows.push(_sqsrows);
});

var mdata = [];

greport['summary'] = gsummary;

gavgreport['uid']='avg';
gavgreport['rows'] = gavgrows;
gavgreport['columns'] = gcloumns;
greport['avg'] = gavgreport;

gqsreport['uid']='qs';
gqsreport['rows'] = gqsrows;
gqsreport['columns'] = gcloumns;
greport['qs'] = gqsreport;

//
//_.each(message,function(val,key){
//  	var single = {};
//		_show = true;
//		single['name'] = key;
//		single['uid'] = key;
//		var keycolumns = [];
//		var maxId = 0;
//		_.each(val,function(kval,akey){
//			var _length = _.size(kval);
//			if (_length>maxId) maxId = _length;
//			if (_length>0) keycolumns.push(akey);
//		});
//		var glastkeyData = {};
//		_.each(keycolumns,function(dkey){gcolumns[dkey]=true;});	
//		var grows = [];
//		for (var i = 0;i< maxId;i++) {
//			var rows = [];
//  		rows.push(i+1);
//			_.each(keycolumns,function(dkey){
//  			//console.log('dkey' + dkey + ' ' +i + JSON.stringify(val[dkey]))
//				rows.push(val[dkey][i] || 0);
//				//_vaild = true;
//  		});	
//			grows.push(rows);
//		}
//		var gsummary = {};
//		_.each(keycolumns,function(dkey){
//			var summary = {};
//			var kdata = val[dkey];
//			var min = Number.MAX_VALUE,max = 0;
//			var sindex = 0,sum = 0;
//			_.each(kdata,function(time){
//				if (time>max) max = time;
//				if (time<min) min = time;
//				sum +=time;
//				++sindex;
//			});
//			var avg = Math.round(sum/sindex);
//			summary = {'max':max,'min':min,'avg':avg,'qs':Math.round(1000/avg),'size':sindex};
//			gsummary[dkey] = (summary);
//		});	
//		single['summary'] = gsummary;
//		single['charts'] =  {"latency":{"name":"robot","uid":single['uid'],"columns":gcolumns,"rows":grows}};
//		if (grows.length>0)	mdata.push(single);
//});
mdata.push(greport);
update(mdata);
}

function showUI(value){
	$("#run-button").css('display',value);
	$("#runcode-button").css('display',value);
	$("#codeinput").css('display',value);
}

WebClient.prototype = {

  // Add a new Node to pool
  add_node: function(nodeId,iport) {
    var node = new _node.Node(nodeId,iport,this);
    node.render();
    var nodeId = nodeId;
    this.nodes[nodeId] = node;
    this.stats.nodes++;
  },

  // Remove Node from pool
  remove_node: function(nodeId) {
    var node = this.nodes[nodeId];
    node.destroy();
    this.stats.nodes--;
    delete this.nodes[node.nodeId];
    if (this.stats.nodes<=0){
    	showUI('none');
    }
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
 
}

// Export for nodeunit tests
try {
  exports.WebClient = WebClient;
} catch(err) {
	
}
