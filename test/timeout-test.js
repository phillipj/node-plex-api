var expect = require('expect.js');
var server = require('./server');

var ROOT_URL = '/';

var PlexAPI = require('..');

describe('timeout error', function() {
	var api;

	beforeEach(function() {
		server.timeoutError();

		api = new PlexAPI({ hostname: 'localhost', timeout: 10});
	});

	afterEach(server.stop);

	it('returns error on timeout', function(done) {
		api.query('/').catch(function (err) {
			expect(err.code).to.be('ETIMEDOUT');
			done();
		});
	});
});
