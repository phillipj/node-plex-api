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
