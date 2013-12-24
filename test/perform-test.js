var expect = require('expect.js');
var server = require("./server");

var ROOT_URL = "/";
var PERFORM_URL = "/library/sections/1/refresh";

var PlexAPI = require("..");

describe("perform()", function() {
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
		expect(api.perform).to.be.a('function');
	});

	it("requires url parameter", function() {
		expect(function() {
			api.perform();
		}).to.throwException("TypeError");
	});

	it("promise should fail when not able to connect to server", function(done) {
		server.stop();
		api.perform(PERFORM_URL).fail(function(err) {
			expect(err).not.to.be(null);
			done();
		});
	});

	it("promise should succeed when request response status code is 200", function(done) {
		api.perform(PERFORM_URL).then(done);
	});
});