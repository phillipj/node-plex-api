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
	start: function start(options) {
		options = options || {};
		options.port = options.port || PLEX_SERVER_PORT;
		options.contentType = options.contentType || 'application/json';
		respondWith = 'content';

		var scope = nock('http://localhost:' + options.port, {
					reqheaders: options.reqheaders
				})
				.defaultReplyHeaders({
					'Content-Type': options.contentType
				})
				.filteringPath(replaceActualPathToRoot)
				.get('/')
				.reply(options.statusCode || 200, respondToRequest);

		// NOT TO PLEASED ABOUT HARDCODING THIS MATCHHEADER() TOKEN ...
		if (options.expectRetry) {
			scope
				.get('/')
				.matchHeader('X-Plex-Token', 'abc-pretend-to-be-token')
				.reply(200, respondToRequest);
		}

		return scope;
	},

	expectsPost: function start(options) {
		options = options || {};
		options.port = options.port || PLEX_SERVER_PORT;
		options.contentType = options.contentType || 'application/json';
		respondWith = 'content';

		return nock('http://localhost:' + options.port, {
					reqheaders: options.reqheaders
				})
				.defaultReplyHeaders({
					'Content-Type': options.contentType
				})
				.filteringPath(replaceActualPathToRoot)
				.post('/')
				.reply(options.statusCode || 200, respondToRequest);
	},

	stop: function stop() {
		nock.cleanAll();
	},

	withoutContent: function withoutContent() {
		respondWith = null;
	},

	fails: function fails() {
		respondWith = 'failure';
	}
};