var uuid = require('uuid');
var fs = require('fs');
var readline = require('readline');
var net = require('net');
var WorkerProtocol = require('./WorkerProtocol');

var workerID = uuid.v4().slice(0, 4);
var messageCount = 0;

var dataChannel = new net.Socket({ fd: 4, readable: true, writable: true });
var dataReader = readline.createInterface({ input: dataChannel, terminal: false, historySize: 0 });

dataReader.on('line', function(line) {
	messageCount += 1;
	var inboundMessage = WorkerProtocol.decode(line);
	var request = JSON.parse(inboundMessage.data);
	var response = { jsonrpc: '2.0', id: request.id, result: { date: (new Date()).toISOString() } };
	setTimeout(function() {
		dataChannel.write(WorkerProtocol.encode({ metadata: inboundMessage.metadata, data: JSON.stringify(response) }));
	}, 1000);
});

process.on('message', function(message) {
	process.send({ data: 'this is a reply' });
	messageCount += 1;
});

setInterval(function() {
	process.send({ workerID: workerID, stats: { messageCount } });
}, 5000);
