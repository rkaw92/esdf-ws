'use strict';

var DataPipe = require('./communication/DataPipe');
var IPC = require('./communication/IPC');
var EventEmitter = require('events').EventEmitter;
var readline = require('readline');
var net = require('net');
var uuid = require('uuid');

/**
 * A Worker represents a single system-level process, local or remote,
 *  that consumes and produces messages over a bi-directional communication channel.
 * Each worker also has a separate control channel for coordination.
 * Note that this class applies to both sides of the channels, i.e. the same
 *  class is used in the master and in the worker process itself. Thus,
 *  calling Worker#send() in a worker will actually talk to the master process.
 * This is intended.
 * @class
 */
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
	
	/**
	 * Get the unique ID of this worker process.
	 * Note: currently, this will disagree between the master and the worker.
	 * Be sure to only use the ID obtained on one side, not both.
	 * @returns {string}
	 */
	getWorkerID() {
		return this._workerID;
	}
	
	/**
	 * Send a message to the process at the other end of the data channel.
	 * Called from the master, this sends data to the worker.
	 * On the other hand, calling this method from inside the worker process
	 *  sends a message to the master process.
	 * @param {Object} message - The message to send.
	 * @param {Object} message.metadata - A label for the message as a whole. May contain contextual information, such as authorization tokens or a user ID.
	 * @param {string} message.data - The data to send to the process.
	 */
	send(message) {
		this.isEnabled = this.dataChannel.write(message);
	}
	
	/**
	 * Get a Worker object that is suitable for use on the worker process side.
	 * This currently uses file descriptor number 4 (hard-coded) and process.on('message') in the worker process.
	 * Note that calling this from the master process is probably not a good idea.
	 * @returns {Worker}
	 */
	static become() {
		var dataSocket = new net.Socket({ fd: 4, readable: true, writable: true });
		// Note: in the line below, "process" refers to the global variable supplied by Node.
		return new Worker(dataSocket, process);
	}
}

module.exports = Worker;
