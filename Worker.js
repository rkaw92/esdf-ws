'use strict';

var childProcess = require('child_process');
var EventEmitter = require('events').EventEmitter;
var readline = require('readline');
var WorkerProtocol = require('./WorkerProtocol');

class Worker extends EventEmitter {
	constructor(scriptName) {
		super();
		
		var self = this;
		self.isEnabled = true;
		
		self._child = childProcess.spawn(process.execPath, [ scriptName ], {
			stdio: [
				// stdin
				0,
				// stdout
				1,
				// stderr
				2,
				// IPC - control channel
				'ipc',
				// data channel - using this, we can avoid parsing and stringifying JSON all the time
				'pipe'
			]
		});
		self._dataChannel = self._child.stdio[4];
		
		self._dataChannel.on('drain', function() {
			self.isEnabled = true;
		});
		
		var rl = readline.createInterface({ input: self._dataChannel, terminal: false, historySize: 0 });
		rl.on('line', function(line) {
			var inboundMessage = WorkerProtocol.decode(line);
			self.emit('message', inboundMessage.metadata, inboundMessage.data);
		});
		
		self._child.on('message', function(controlMessage) {
			self.emit('controlMessage', controlMessage);
		});
	}
	
	send(metadata, data) {
		this.isEnabled = this._dataChannel.write(WorkerProtocol.encode({ metadata: metadata, data: data }));
	}
	
	sendControl(controlData) {
		this._child.send(controlData);
	}
}

module.exports = Worker;
