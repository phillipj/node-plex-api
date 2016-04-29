var expect = require('expect.js');
var server = require('./server');

var ROOT_URL = '/';
var PERFORM_URL = '/library/sections/1/refresh';

var PlexAPI = require('..');

describe('perform()', function() {
	var api;

	beforeEach(function() {
		server.start();
		server.withoutContent();

		api = new PlexAPI('localhost');
	});

	afterEach(server.stop);

	it('should exist', function() {
		expect(api.perform).to.be.a('function');
	});

	describe('parameters', function() {
		it('requires url parameter', function() {
			expect(function() {
				api.perform();
			}).to.throwException('TypeError');
		});

		it('can accept url parameter as only parameter', function() {
			return api.perform('/');
		});

		it('can accept url parameter as part of a parameter object', function() {
			return api.perform({uri: '/'});
		});

		it('uses extra headers passed in parameters', function() {
			server.stop();
			var nockServer = server.start({'reqheaders': {
				'X-TEST-HEADER':'X-TEST-HEADER-VAL'
			}});

			return api.perform({uri: '/', extraHeaders: {'X-TEST-HEADER':'X-TEST-HEADER-VAL'}}).then(function(result) {
				nockServer.done();
				return result;
			});
		});
	});

	it('promise should fail when request response status code is 403', function(done) {
		const AUTH_TOKEN = 'my-auth-token';

		api = new PlexAPI({
			hostname: 'localhost',
			token: AUTH_TOKEN
		});

		// we need to clear the standard nock response from server.start() invoked in the test setup,
		// or else the mocked server will *not* respond with 403 status
		server.stop();

		var scope = server.empty()
			.get('/library/sections/8/refresh')
			.matchHeader('X-Plex-Token', AUTH_TOKEN)
			.reply(403, "<html><head><title>Forbidden</title></head><body><h1>403 Forbidden</h1></body></html>", { 'content-length': '85',
			'content-type': 'text/html',
			connection: 'close',
			'x-plex-protocol': '1.0',
			'cache-control': 'no-cache' });

		api.perform('/library/sections/8/refresh').catch(function(err) {
			expect(err.message).to.contain('Plex Server denied request due to lack of managed user permissions!');
			done();
		});
	});

	it('promise should fail when server responds with failure status code', function() {
		server.fails();
		return api.perform(PERFORM_URL).fail(function(err) {
			expect(err).not.to.be(null);
		});
	});

	it('promise should succeed when request response status code is 200', function() {
		return api.perform(PERFORM_URL);
	});

	it('promise should succeed when request response status code is 201', function() {
		server.stop();
		server.start({
		  statusCode: 201
		});
		server.withoutContent();
		return api.perform(PERFORM_URL);
	});
});
