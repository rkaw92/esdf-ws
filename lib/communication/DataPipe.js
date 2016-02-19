'use strict';

var EventEmitter = require('events').EventEmitter;
var readline = require('readline');
var WorkerLineProtocol = require('./protocols/WorkerLineProtocol');

class DataPipe extends EventEmitter {
	constructor(pipe) {
		super();
		var self = this;
		self._pipe = pipe;
		self._lineReader = readline.createInterface({ input: pipe, terminal: false, historySize: 0 });
		self._lineReader.on('line', function(inboundLine) {
			var inboundMessage = WorkerLineProtocol.decode(inboundLine);
			self.emit('message', inboundMessage);
		});	
		// We need to proxy the events typically emitted by a WritableStream, so that write() flow control may be accomplished.
		self._pipe.on('drain', function() { self.emit('drain'); });
		self._pipe.on('error', function(error) { self.emit('error', error); });
		self._pipe.on('close', function(reason) { self.emit('close', reason); });
	}
	
	write(message) {
		return this._pipe.write(WorkerLineProtocol.encode(message));
	}
}

module.exports = DataPipe;
