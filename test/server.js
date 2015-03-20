var http = require('http');
var fs = require('fs');

var PLEX_SERVER_PORT = 32400;

var server = http.createServer(function(req, res) {
	var sampleFilename = 'root';

	if (req.url === '/library/sections/1/refresh') {
		res.writeHead(200);
		return res.end();
	} else if (req.url === '/library/sections') {
		sampleFilename = 'library_sections';
	}  else if (req.url === '/clients') {
		sampleFilename = 'clients';
	}

	deliverXml(sampleFilename, res);
});

function deliverXml(filename, response) {
	fs.readFile('test/samples/'+ filename +'.json', function(err, content) {
        response.writeHead(200, { 'Content-Type': 'application/json' });
		response.write(content);
		response.end();
	});
}

module.exports = {
	start: function (port) {
		server.listen(port || PLEX_SERVER_PORT);
	},

	stop: function() {
		server.close();
	}
};