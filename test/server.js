var fs = require('fs');
var nock = require('nock');

var PLEX_SERVER_PORT = 32400;

var respondWith;

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
	start: function start(port, options) {
		options = options || {};
		port = port || PLEX_SERVER_PORT;
		respondWith = 'content'

		return nock('http://localhost:' + port, {
					reqheaders: options.reqheaders
				})
				.filteringPath(replaceActualPathToRoot)
				.get('/')
				.reply(options.statusCode || 200, respondToRequest);
	},

	stop: function stop() {
		nock.cleanAll();
	},

	requiresAuthToken: function requiresAuthToken(options) {
		options = options || {};

		return nock('https://plex.tv',  {
					reqheaders: options.reqheaders
				})
				.post('/users/sign_in.xml')
				.replyWithFile(201, __dirname + '/samples/users/sign_in.xml');
	},

	withoutContent: function withoutContent() {
		respondWith = null;
	},

	fails: function fails() {
		respondWith = 'failure';
	}
};