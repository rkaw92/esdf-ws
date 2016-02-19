'use strict';

var DataPipe = require('./communication/DataPipe');
var IPC = require('./communication/IPC');
var EventEmitter = require('events').EventEmitter;
var readline = require('readline');
var net = require('net');
var uuid = require('uuid');

class Worker extends EventEmitter {
	constructor(pipe, process) {
		super();
		var self = this;
		self.isEnabled = true;
		self._workerID = uuid.v4();
		
		self.dataChannel = new DataPipe(pipe);
		self.controlChannel = new IPC(process);
		
		self.dataChannel.on('message', function(inboundMessage) {
			self.emit('message', inboundMessage);
		});
		
		self.dataChannel.on('drain', function() {
			self.isEnabled = true;
		});
		
		// Note: we listen on the entire process's sole IPC channel.
		// Thus, the Worker can be considered a singleton.
		self.controlChannel.on('message', function(message) {
			//TODO: Handle messages on the control plane, too.
		});
	}
	
	getWorkerID() {
		return this._workerID;
	}
	
	send(message) {
		this.isEnabled = this.dataChannel.write(message);
	}
	
	static become() {
		var dataSocket = new net.Socket({ fd: 4, readable: true, writable: true });
		// Note: in the line below, "process" refers to the global variable supplied by Node.
		return new Worker(dataSocket, process);
	}
}

module.exports = Worker;
