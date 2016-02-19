var childProcess = require('child_process');
var Worker = require('../Worker');

function createWorker(scriptName, options) {
	options = options || {};
	var child = childProcess.spawn(options.execPath || process.execPath, [ scriptName ], {
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
	
	// Construct a Worker with the data channel and the control channel configured as (pipe, IPC).
	var worker = new Worker(child.stdio[4], child);
	return worker;
}

module.exports = createWorker;
