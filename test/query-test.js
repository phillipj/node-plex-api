var expect = require('expect.js');
var server = require("./server");

var ROOT_URL = "/";
var CLIENTS_URL = "/clients";

var PlexAPI = require("..");

describe("query()", function() {
	var api;

	beforeEach(function() {
		server.start();

		api = new PlexAPI("localhost");
	});

	afterEach(function() {
		try {
			server.stop();
		} catch (ignoredException) {}
	});

	it("should exist", function() {
		expect(api.query).to.be.a('function');
	});

	it("requires url parameter", function() {
		expect(function() {
			api.query();
		}).to.throwException("TypeError");
	});

	it("requires callback parameter", function() {
		expect(function() {
			api.query(ROOT_URL);
		}).to.throwException("TypeError");
	});

	it("should provide error as first argument to callback when unable to connect", function(done) {
		server.stop();
		api.query(ROOT_URL, function(err) {
			expect(err).not.to.be(null);
			done();
		});
	});

	it("should not have an error argument when server responds", function(done) {
		api.query(ROOT_URL, function(err, result) {
			expect(err).to.be(null);
			expect(result).to.be.an('object');
			done();
		});
	});

	it("should have response MediaContainer attributes as result.attributes", function(done) {
		api.query(ROOT_URL, function(err, result) {
			expect(result.attributes.version).to.contain('0.9.7');
			done();
		});
	});

	it("should have response Directory items as result.directories", function(done) {
		api.query(ROOT_URL, function(err, result) {
			expect(result.directory.length).to.be(2);
			done();
		});
	});

	describe("Directory URI", function() {
		it("should provide an uri property", function(done) {
			api.query(ROOT_URL, function(err, result) {
				expect(result.directory[0].uri).not.to.be(undefined);
				done();
			});
		});

		it("should provide an uri property combined of parent's URI and the item's key attribute", function(done) {
			api.query("/library/sections", function(err, result) {
				expect(result.directory[0].uri).to.be("/library/sections/1");
				done();
			});
		});
	});

	describe("Server URI", function() {
		it("should provide an uri property", function(done) {
			api.query(CLIENTS_URL, function(err, result) {
				expect(result.server[0].uri).not.to.be(undefined);
				done();
			});
		});

		it("should provide uri property used to control Plex application", function(done) {
			api.query(CLIENTS_URL, function(err, result) {
				expect(result.server[0].uri).to.be("/system/players/192.168.0.2");
				done();
			});
		});
	});
});