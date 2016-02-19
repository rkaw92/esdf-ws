var Worker = require('./lib/Worker');
var messageCount = 0;

var worker = Worker.become();
var workerID = worker.getWorkerID();
worker.on('message', function(message) {
	// Note that, even though the message envelope has been parsed into data and metadata, we still need
	//  to parse the data part. The protocol is not constrained to JSON data payloads.
	var request = JSON.parse(message.data);
	var response = { jsonrpc: '2.0', id: request.id, result: { date: (new Date()).toISOString() } };
	// Simulate a slight delay in processing:
	setTimeout(function() {
		messageCount += 1;
		worker.send({ metadata: message.metadata, data: JSON.stringify(response) });
	}, 1000);
});

setInterval(function() {
	worker.controlChannel.write({ workerID: workerID, stats: { messageCount } });
}, 5000);
