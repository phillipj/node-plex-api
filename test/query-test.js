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

	it('should exist', function() {
		expect(api.query).to.be.a('function');
	});

	it('requires url parameter', function() {
		expect(function() {
			api.query();
		}).to.throwException('TypeError');
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
});