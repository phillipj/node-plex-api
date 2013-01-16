var buster = require("buster");
var server = require("./server");

var ROOT_URL = "/";
var PERFORM_URL = "/library/sections/1/refresh";

var PlexAPI = require("..");

buster.testCase("perform()", {
	setUp: function() {
		server.start();
		this.api = new PlexAPI("localhost");
	},

	tearDown: function() {
		try {
			server.stop();
		} catch (ignoredException) {}
	},

	"method exists": function() {
		assert.isFunction(this.api.perform);
	},

	"requires url parameter": function() {
		assert.exception(function() {
			this.api.perform();
		}, "TypeError");
	},

	"requires callback parameter": function() {
		assert.exception(function() {
			this.api.perform(ROOT_URL);
		}, "TypeError");
	},

	"should provide an error object as first parameter when not able to connect to server": function(done) {
		server.stop();
		this.api.perform(PERFORM_URL, function(err, successfull) {
			refute.isNull(err);
			done();
		});
	},

	"second parameter should be true when request response status code is 200": function(done) {
		this.api.perform(PERFORM_URL, function(err, successfull) {
			assert(successfull);
			done();
		});
	}
});