'use strict';

var os = require('os');
var createWorker = require('./utils/createWorker');

var defaults = {
	workerCount: os.cpus().length || 4,
	workerScript: 'worker.js',
	init: function noInit(worker) {}
};

class WorkerManager {
	constructor(options) {
		this.options = Object.assign(defaults, options || {});
		this.workers = [];
		this.lastWorker = 0;
	}
	
	start() {
		var self = this;
		
		function startWorker() {
			var worker = createWorker(self.options.workerScript);
			self.options.init(worker);
			
			var workerAlive = true;
			self.workers.push(worker);
			function restartWorker() {
				//TODO: Stopping.
				if (workerAlive) {
					workerAlive = false;
					self.workers = self.workers.filter((element) => (element !== worker));
					startWorker();
				}
			}
			worker.on('error', restartWorker);
			worker.on('close', restartWorker);
		}
		
		for (let i = 0; i < self.options.workerCount; i += 1) {
			startWorker();
		}
	}
	
	getWorker() {
		var worker;
		var workerCount = this.workers.length;
		var visitedWorkers = 0;
		
		// Look for an available worker. If all are busy processing, we will find none.
		while (!worker && visitedWorkers < workerCount) {
			if (this.workers[this.lastWorker].isEnabled) {
				worker = this.workers[this.lastWorker];
			}
			this.lastWorker = (this.lastWorker + 1) % this.workers.length;
			visitedWorkers += 1;
		}
		
		return worker;
	}
}

module.exports = WorkerManager;