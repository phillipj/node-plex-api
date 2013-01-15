var http = require("http");
var fs = require("fs");

var PLEX_SERVER_PORT = 32400;

var server = http.createServer(function(req, res) {
	if (req.url === "/library/sections/1/refresh") {
		res.writeHead(200);
		res.end();
	} else {
		fs.readFile("test/samples/root.xml", function(err, content) {
			res.write(content);
			res.end();
		});
	}
});

module.exports = {
	start: function (port) {
		server.listen(port || PLEX_SERVER_PORT);
	},

	stop: function() {
		server.close();
	}
};