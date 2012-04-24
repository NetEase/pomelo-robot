function jsonToTable(json) {
		var txt = "";
		for ( var i in json) {
			var ele = json[i];
 			txt += "<tr><td class=label>" + i + "</td><td>" + ele.max + "</td><td>" + ele.min + "</td><td>" + ele.avg + "</td><td>" + ele.qs + "</td><td>" + ele.size + "</td></tr>";
		}
		return txt;
};

var raw_reports;
function update(reports) {
	raw_reports = reports;
	reports.forEach(function(report) {
		var summary = document.getElementById("reportSummary");
		summary.innerHTML = jsonToTable(report.summary);
		var chart = report.avg;
		updateGraph(report.avg,'avgrestime');
		updateGraph(report.qs,'qstime');
	});
}

function updateGraph(chart,targetName) {
	var main = document.getElementById(targetName);
	if (graphs[chart.uid]) {
		graphs[chart.uid].updateOptions({
			"file" : chart.rows,
			labels : chart.columns
		});
	} else {
		var newchart = document.createElement("div");
		newchart.setAttribute("class", "post");
		newchart.innerHTML = []
				.concat( '<div class="entry" style="width:100%;float:left">',
						'<div id="chart', chart.uid, '" style="float:left;width:80%;height:200px;"></div>',
						'<div id="chartlegend', chart.uid, '" style="float:left;width:80px;height:200px;"></div>',
						'</div>').join('');
		main.appendChild(newchart);
		graphs[chart.uid] = new Dygraph(document.getElementById("chart"
				+ chart.uid), chart.rows, {
			labelsDiv : document.getElementById("chartlegend" + chart.uid),
			labelsSeparateLines : true,
			labels : chart.columns
		});
	}
}

graphs = {};
//update([{"name":"","uid":0,"summary":
//{"Load Data uniques uniqs":2000},"charts":{"latency":{"name":"","uid":22,"columns":["time","min","max","avg","median","95%","99%"],"rows":[[0.03,0,0,0,0,0,0],[0.03,5,92,27.5,26,45,75],[0.04,6,62,26,25,45,57]]}}}]);