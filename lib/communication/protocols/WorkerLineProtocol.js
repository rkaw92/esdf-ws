function encode(message) {
	return JSON.stringify(message.metadata) + '\0' + message.data + '\n';
}

function decode(line) {
	var delimiterPosition = line.indexOf('\0');
	var metadataBlob = line.slice(0, delimiterPosition);
	var dataBlob = line.slice(delimiterPosition + 1);
	return {
		metadata: JSON.parse(metadataBlob),
		data: dataBlob
	};
}

module.exports = {
	encode,
	decode
};
