var expect = require('expect.js');
var server = require('./server');

var ROOT_URL = '/';

var PlexAPI = require('..');

describe('postQuery()', function() {
	var api;

	beforeEach(function() {
		server.expectsPost();

		api = new PlexAPI('localhost');
	});

	afterEach(server.stop);

	it('should exist', function() {
		expect(api.postQuery).to.be.a('function');
	});

	describe('parameters', function() {
		it('requires url parameter', function() {
			expect(function() {
				api.postQuery();
			}).to.throwException('TypeError');
		});

		it('can accept url parameter as only parameter', function() {
			return api.postQuery('/');
		});

		it('can accept url parameter as part of a parameter object', function() {
			return api.postQuery({uri: '/'});
		});

		it('uses extra headers passed in parameters', function() {
			server.stop();
			var nockServer = server.expectsPost({'reqheaders': {
				'X-TEST-HEADER':'X-TEST-HEADER-VAL'
			}});

			return api.postQuery({uri: '/', extraHeaders: {'X-TEST-HEADER':'X-TEST-HEADER-VAL'}}).then(function(result) {
				nockServer.done();
				return result;
			});
		});
	});

	it('promise should fail when server responds with failure status code', function() {
        return api.postQuery(ROOT_URL).fail(function(err) {
			expect(err).not.to.be(null);
		});
	});

	it('promise should succeed when request response status code is 200', function() {
		return api.postQuery(ROOT_URL);
	});

	it('promise should succeed when request response status code is 201', function() {
		server.stop();
		server.expectsPost({statusCode: 201});
		return api.postQuery(ROOT_URL);
	});

	it('should result in a POST request', function() {
		return api.postQuery(ROOT_URL);
	});
});