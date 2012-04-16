// ------------------------------------
// HTTP Server
// ------------------------------------
//
// This file defines HttpServer and the singleton HTTP_SERVER.
//
// This file defines a generic HTTP server that serves static files and that can be configured
// with new routes. It also starts the nodeload HTTP server unless require('nodeload/config')
// .disableServer() was called.
// 
var BUILD_AS_SINGLE_FILE;
if (!BUILD_AS_SINGLE_FILE) {
var http = require('http');
var fs = require('fs');
var util = require('../common/util');
var qputs = util.qputs;
var EventEmitter = require('events').EventEmitter;
}

/** By default, HttpServer knows how to return static files from the current directory. Add new route 
regexs using HttpServer.on(). */
var HttpServer = exports.HttpServer = function HttpServer() {
    this.routes = [];
    this.running = false;
};
util.inherits(HttpServer, EventEmitter);
/** Start the server listening on the given port */
HttpServer.prototype.start = function(port, hostname) {
    if (this.running) { return; }
    this.running = true;

    var self = this;
    port = port || 8000;
    self.hostname = hostname || 'localhost';
    self.port = port;
    self.connections = [];

    self.server = http.createServer(function(req, res) { self.route_(req, res); });
    self.server.on('connection', function(c) { 
        // We need to track incoming connections, beause Server.close() won't terminate active
        // connections by default.
        c.on('close', function() {
            var idx = self.connections.indexOf(c);
            if (idx !== -1) {
                self.connections.splice(idx, 1);
            }
        });
        self.connections.push(c);
    });
    self.server.listen(port, hostname);

    self.emit('start', self.hostname, self.port);
    return self;
};
/** Terminate the server */
HttpServer.prototype.stop = function() {
    if (!this.running) { return; }
    this.running = false;
    this.connections.forEach(function(c) { c.destroy(); });
    this.server.close();
    this.server = null;
    this.emit('end');
};
/** When an incoming request matches a given regex, route it to the provided handler:
function(url, ServerRequest, ServerResponse) */
HttpServer.prototype.addRoute = function(regex, handler) {
    this.routes.unshift({regex: regex, handler: handler});
    return this;
};
HttpServer.prototype.removeRoute = function(regex, handler) {
    this.routes = this.routes.filter(function(r) {
        return !((regex === r.regex) && (!handler || handler === r.handler));
    });
    return this;
};
HttpServer.prototype.route_ = function(req, res) {
    for (var i = 0; i < this.routes.length; i++) {
        if (req.url.match(this.routes[i].regex)) {
            this.routes[i].handler(req.url, req, res);
            return;
        }
    }
    if (req.method === 'GET') {
        this.serveFile_('.' + req.url, res);
    } else {
        res.writeHead(405, {"Content-Length": "0"});
        res.end();
    }
};
HttpServer.prototype.serveFile_ = function(file, response) {
	  file = process.cwd() + '/lib/console/' + file;
    fs.stat(file, function(err, stat) {
        if (err) {
            response.writeHead(404, {"Content-Type": "text/plain"});
            response.write("Cannot find file: " + file);
            response.end();
            return;
        }

        fs.readFile(file, "binary", function (err, data) {
            if (err) {
                response.writeHead(500, {"Content-Type": "text/plain"});
                response.write("Error opening file " + file + ": " + err);
            } else {
            		if (file.lastIndexOf('.html')==-1) {
            			response.writeHead(200, { 'Content-Length': data.length });
            			response.write(data, "binary");
            		} else {
            			response.writeHead(200, { 'Content-Length': data.length,"Content-Type":"text/html; charset=utf-8"});
            			response.write(data, "binary");
            		}
            }
            response.end();
        });
    });
};

// =================
// Singletons
// =================
/** The global HTTP server used by nodeload */
var HTTP_SERVER = exports.HTTP_SERVER = new HttpServer();
HTTP_SERVER.on('start', function(hostname, port) {
    qputs('Started HTTP server on ' + hostname + ':' + port + '.');
});

HTTP_SERVER.on('end', function() {
    qputs('Shutdown HTTP server.');
});
 