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

	it('should retry with an authToken when request response status code is 403', function() {
		const AUTH_TOKEN   = 'my-auth-token';
		const ACCESS_TOKEN = 'my-access-token';

		api.accessToken = ACCESS_TOKEN;
		api.authToken   = AUTH_TOKEN;

		var scope = server.empty()
			.get('/library/sections/8/refresh')
			.matchHeader('X-Plex-Token', ACCESS_TOKEN)
			.reply(403, "<html><head><title>Forbidden</title></head><body><h1>403 Forbidden</h1></body></html>", { 'content-length': '85',
			'content-type': 'text/html',
			connection: 'close',
			'x-plex-protocol': '1.0',
			'cache-control': 'no-cache' })

			.get('/library/sections/8/refresh')
			.matchHeader('X-Plex-Token', AUTH_TOKEN)
			.reply(200, "", { 'content-length': '0',
			'content-type': 'text/html',
			connection: 'close',
			'x-plex-protocol': '1.0',
			'cache-control': 'no-cache' });

		return api.perform('/library/sections/8/refresh').then(function() {
			expect(scope.isDone()).to.be.true;
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
