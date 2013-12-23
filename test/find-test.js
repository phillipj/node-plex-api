var expect = require('expect.js');
var server = require("./server");

var ROOT_URL = "/";
var PERFORM_URL = "/library/sections/1/refresh";

var PlexAPI = require("..");

describe("find()", function() {
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
		expect(api.find).to.be.a('function');
	});

	it("requires url parameter", function() {
		expect(function() {
			api.find();
		}).to.throwException("TypeError");
	});

	it("requires callback parameter", function() {
		expect(function() {
			api.find("/");
		}).to.throwException("TypeError");
	});

	it("should provide all child items found", function(done) {
		api.find("/library/sections", function(err, directories) {
			expect(directories).to.be.an('array');
			expect(directories.length).to.be(3);
			done();
		});
	});

	it("should filter items when given an object of criterias as second parameter", function(done) {
		api.find("/library/sections", {type: "movie"}, function(err, directories) {
			expect(directories.length).to.be(2);
			done();
		});
	});

	it("should match item attributes by regular expression", function(done) {
		api.find("/library/sections", {type: "movie|show"}, function(err, directories) {
			expect(directories.length).to.be(3);
			done();
		});
	});

	it("should provide all Server items found", function(done) {
		api.find("/clients", function(err, clients) {
			var firstServer = clients[0];
			expect(firstServer.attributes.name).to.be("mac-mini");
			done();
		});
	});
});