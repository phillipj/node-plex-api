var http = require('http');
var fs = require('fs');
var PLEX_SERVER_PORT = 32400;

var server = http.createServer(function onRequest(req, res) {
	var sampleFilename = 'root';

	if (req.url === '/library/sections/1/refresh') {
		res.writeHead(200);
		return res.end();
	} else if (req.url === '/library/sections') {
		sampleFilename = 'library_sections';
	}  else if (req.url === '/clients') {
		sampleFilename = 'clients';
	}

	deliverSampleContent(sampleFilename, res);
});

function deliverSampleContent(filename, response) {
	var filepath = hasExtension(filename) ? filename : filename + '.json';
	fs.createReadStream('test/samples/'+ filepath).pipe(response);
}

function hasExtension(filename) {
	return filename.indexOf('.') !== -1;
}

module.exports = {
	start: function start(port) {
		server.listen(port || PLEX_SERVER_PORT);
	},

	stop: function stop() {
		server.close();
	}
};