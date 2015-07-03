var expect = require('expect.js');
var server = require('./server');

var ROOT_URL = '/';

var PlexAPI = require('..');

describe('postQuery()', function() {
	var api;

	beforeEach(function() {
		server.start();

		api = new PlexAPI('localhost');
	});

	afterEach(server.stop);

	it('should exist', function() {
		expect(api.postQuery).to.be.a('function');
	});

	it('requires url parameter', function() {
		expect(function() {
			api.postQuery();
		}).to.throwException('TypeError');
	});

	it('promise should fail when server responds with failure status code', function() {
        return api.postQuery(ROOT_URL).fail(function(err) {
			expect(err).not.to.be(null);
		});
	});

	it('promise should succeed when request response status code is 200', function() {
		server.expectsPost();
		return api.postQuery(ROOT_URL);
	});

	it('should result in a POST request', function() {
		server.expectsPost();
		return api.postQuery(ROOT_URL);
	});
});