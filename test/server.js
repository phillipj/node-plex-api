var fs = require('fs');
var nock = require('nock');

var PLEX_SERVER_PORT = 32400;

var respondWith;
var scope;

function hasExtension(filename) {
	return filename.indexOf('.') !== -1;
}

function replaceSlashWithRoot(uri) {
	return uri.replace(/^\/$/, '/root');
}

function respondToRequest(uri, requestBody, cb) {
	uri = replaceSlashWithRoot(uri);

	var filepath = hasExtension(uri) ? uri : uri + '.json';
	if (respondWith === 'content') {
		fs.readFile('test/samples/'+ filepath, cb);
	} else if (respondWith === 'failure') {
		return cb(new Error('Server decided to fail...'));
	} else {
		cb(null);
	}
}

// Looks kinda strange, but its needed for nock
// not to explode as we've got one .get('/') in our nock scope
function replaceActualPathToRoot(path) {
	return '/';
}

module.exports = {
	start: function start(port, hostname) {
		port = port || PLEX_SERVER_PORT;
		hostname = hostname || 'localhost';

		respondWith = 'content'

		scope = nock('http://'+ hostname +':' + port)
				.filteringPath(replaceActualPathToRoot)
				.get('/')
				.reply(200, respondToRequest);
	},

	withoutContent: function withoutContent() {
		respondWith = null;
	},

	fails: function fails() {
		respondWith = 'failure';
	}
};