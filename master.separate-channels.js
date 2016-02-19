var ws = require('ws');
var http = require('http');
var uuid = require('uuid');
var nodefn = require('when/node');

var WorkerManager = require('./lib/WorkerManager');

// ### Server bindings ###
var webServer = http.createServer();
var websocketServer = new ws.Server({
	server: webServer,
	disableHixie: true,
	clientTracking: false,
	perMessageDeflate: false,
	//maxPayload: 1000000
});

// ### Clients and workers ###

var clients = new Map();

var workers = new WorkerManager({
	workerScript: __dirname + '/worker.js',
	init: function(worker) {
		worker.controlChannel.on('message', function(message) {
			console.log('---> Worker:', message);
		});
		
		worker.on('message', function(message) {
			var metadata = message.metadata;
			var data = message.data;
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
	}
});

// ### Connection handling ###
var droppedCount = 0;
var writtenCount = 0;
websocketServer.on('connection', function(socketClient) {
	var clientID = uuid.v4();
	clients.set(clientID, socketClient);
	console.log('---> Client %s connected', clientID);
	socketClient.on('message', function(data, flags) {
		//console.log('---> Message from %s, forwarding...', clientID);
		var worker = workers.getWorker();
		if (worker) {
			worker.send({ metadata: { clientID }, data: data });
			writtenCount += 1;
		}
		else {
			droppedCount += 1;
			//console.log('---> Dropping message from %s, no workers available', clientID);
			socketClient.send(JSON.stringify({ _system: { error: 'drop' } }));
		}
	});
	socketClient.on('close', function() {
		clients.delete(clientID);
	});
	socketClient.on('error', function() {
		clients.delete(clientID);
	});
});

websocketServer.on('error', function(error) {
	console.log(error);
});


workers.start();

setInterval(function() {
	console.log('Drop rate: %d%', Math.round(droppedCount / (droppedCount + writtenCount) * 100, 0));
}, 5000);

// ### Start-up ###

webServer.listen(process.env.PORT || 7717);
