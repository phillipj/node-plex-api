var expect = require('expect.js');
var server = require('./server');

var ROOT_URL = '/';

var PlexAPI = require('..');

describe('timeoutError()', function() {
	var api;

	beforeEach(function() {
		server.timeoutError();

		api = new PlexAPI({ hostname: 'localhost', timeout: 100});
	});

	afterEach(server.stop);

	it('returns error on timeout', function() {
		return api.postQuery('/');
	});

});
