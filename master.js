var ws = require('ws');
var http = require('http');
var uuid = require('uuid');
var childProcess = require('child_process');
var nodefn = require('when/node');

var WorkerManager = require('./WorkerManager');

// ### Server bindings ###
var webServer = http.createServer();
var websocketServer = new ws.Server({
	server: webServer,
	disableHixie: true,
	clientTracking: false,
	perMessageDeflate: false
});

// ### Clients and workers ###

var clients = new Map();

var workers = new WorkerManager({
	workerConstructor: function() {
		var worker = childProcess.fork(__dirname + '/worker.js', { silent: true });
		worker.on('message', function(metadata, data) {
			if (metadata.clientID) {
				var destinationClient = clients.get(metadata.clientID);
				// Drop unroutable messages.
				if (!destinationClient) {
					return;
				}
				nodefn.call(destinationClient.send.bind(destinationClient), data).catch(function(error) {
					console.log('---E Failed to send message to %s: %s', metadata.clientID, error);
				});
			}
		});
		return worker;
	}
});

// ### Connection handling ###
websocketServer.on('connection', function(socketClient) {
	var clientID = uuid.v4();
	clients.set(clientID, socketClient);
	console.log('---> Client %s connected', clientID);
	socketClient.on('message', function(data, flags) {
		//console.log('---> Message from %s, forwarding...', clientID);
		var worker = workers.getWorker();
		if (worker) {
			worker.send({ clientID: clientID, data: data });
		}
		else {
			
		}
	});
	socketClient.on('close', function() {
		clients.delete(clientID);
	});
});


workers.start();

// ### Start-up ###

webServer.listen(process.env.PORT || 7717);
