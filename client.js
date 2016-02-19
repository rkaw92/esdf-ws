var WebSocket = require('ws');
var ws = new WebSocket('ws://localhost:7717');
var fs = require('fs');

var loremIpsum = fs.readFileSync(__dirname + '/lipsum.txt', 'utf-8');
loremIpsum += loremIpsum;
loremIpsum += loremIpsum;
loremIpsum += loremIpsum;
loremIpsum += loremIpsum;
loremIpsum += loremIpsum;

ws.on('open', function open() {
	function spam() {
		try {
			ws.send(loremIpsum.slice(0, 20), function(error) {
				if (error) { console.log(error); throw error; }
				setTimeout(spam, 1);
			});
		}
		catch(error) {
			console.log('catch:', error);
		}
	}
	
	console.log('Starting spam...');
	spam();
});

ws.on('error', function(error) {
	console.log(error);
});

ws.on('close', function() {
	console.log('close');
});

ws.on('message', function(data) {
	console.log(data);
});