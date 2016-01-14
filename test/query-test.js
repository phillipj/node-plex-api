var expect = require('expect.js');
var server = require('./server');

var ROOT_URL = '/';
var CLIENTS_URL = '/clients';

var PlexAPI = require('..');

describe('query()', function() {
	var api;

	beforeEach(function() {
		server.start();

		api = new PlexAPI('localhost');
	});

	afterEach(server.stop);

	it('should exist', function() {
		expect(api.query).to.be.a('function');
	});

	describe('options', function() {
		it('requires url options', function() {
			expect(function() {
				api.query();
			}).to.throwException('TypeError');
		});

		it('can accept url option as only parameter', function() {
			return api.query('/').then(function(result) {
				expect(result).to.be.an('object');
			});
		});

		it('can accept url option as part of an options object', function() {
			return api.query({uri: '/'}).then(function(result) {
				expect(result).to.be.an('object');
			});
		});

		it('uses extra headers passed in options', function() {
			server.stop();
			var nockServer = server.start({'reqheaders': {
				'X-TEST-HEADER':'X-TEST-HEADER-VAL'
			}});

			return api.query({uri: '/', extraHeaders: {'X-TEST-HEADER':'X-TEST-HEADER-VAL'}}).then(function(result) {
				expect(result).to.be.an('object');
				nockServer.done();
			});
		});
	});

	it('promise should fail when server fails', function(done) {
		server.fails();

		api.query(ROOT_URL).then(function() {
			done(Error('Shouldnt succeed!'));
		}).fail(function(err) {
			expect(err).not.to.be(null);
			done();
		});
	});

	it('promise should succeed when server responds', function() {
		return api.query(ROOT_URL).then(function(result) {
			expect(result).to.be.an('object');
		});
	});

	it('should have response MediaContainer attributes as properties on the resolved result object', function() {
		return api.query(ROOT_URL).then(function(result) {
			expect(result.version).to.contain('0.9.11.4.739-a4e710f');
		});
	});

	it('should have response child Directory items as result._children', function() {
		return api.query(ROOT_URL).then(function(result) {
			expect(result._children.length).to.be(16);
		});
	});

	describe('Directory URI', function() {
		it('should provide an uri property', function() {
			return api.query(ROOT_URL).then(function(result) {
				expect(result._children[0].uri).not.to.be(undefined);
			});
		});

		it('should provide an uri property combined of parent URI and the item key attribute', function() {
			return api.query('/library/sections').then(function(result) {
				expect(result._children[0].uri).to.be('/library/sections/1');
			});
		});

		it('should use the key as the uri if the key is a root-relative path', function() {
			return api.query('/library/sections/1/all').then(function(result) {
				expect(result._children[0].uri).to.be(result._children[0].key);
			});
		});
	});

	describe('Server URI', function() {
		it('should provide an uri property', function() {
			return api.query(CLIENTS_URL).then(function(result) {
				expect(result._children[0].uri).not.to.be(undefined);
			});
		});

		it('should provide uri property used to control Plex application', function() {
			return api.query(CLIENTS_URL).then(function(result) {
				expect(result._children[0].uri).to.be('/system/players/192.168.0.47');
			});
		});
	});

	describe('XML responses', function() {
		it('should convert XML to a JSON object', function() {
			var plexTvApi = new PlexAPI({
				hostname: 'plex.tv',
				port: 443
			});

			server.stop();
			server.start({
				schemeAndHost: 'https://plex.tv',
				port: 443,
				contentType: 'application/xml'
			});

			return plexTvApi.query('/devices.xml').then(function(result) {
				expect(result.MediaContainer).to.be.an('object');
				expect(result.MediaContainer.attributes.publicAddress).to.equal('47.1.2.4');
			});
		});
	});
});