'use strict';

var EventEmitter = require('events').EventEmitter;

class IPC extends EventEmitter {
	constructor(process) {
		super();
		var self = this;
		self._process = process;
		self._process.on('message', function(message) {
			self.emit('message', message);
		});
	}
	
	write(message) {
		return this._process.send(message);
	}
}

module.exports = IPC;
