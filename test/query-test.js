var buster = require("buster");
var server = require("./server");

var ROOT_URL = "/";
var PERFORM_URL = "/library/sections/1/refresh";

var PlexAPI = require("..");

buster.testCase("query()", {
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
		assert.isFunction(this.api.query);
	},

	"requires url parameter": function() {
		assert.exception(function() {
			this.api.query();
		}, "TypeError");
	},

	"requires callback parameter": function() {
		assert.exception(function() {
			this.api.query(ROOT_URL);
		}, "TypeError");
	},

	"should provide error as first argument to callback when unable to connect": function(done) {
		server.stop();
		this.api.query(ROOT_URL, function(err) {
			refute.isNull(err);
			done();
		});
	},

	"should not have an error argument when server responds": function(done) {
		this.api.query(ROOT_URL, function(err, result) {
			assert.isNull(err);
			assert.isObject(result);
			done();
		});
	},

	"should have response MediaContainer attributes as result.attributes": function(done) {
		this.api.query(ROOT_URL, function(err, result) {
			assert.match(result, { attributes: {
				version: '0.9.7'
			}});
			done();
		});
	},

	"should have response Directory items as result.directories": function(done) {
		this.api.query(ROOT_URL, function(err, result) {
			assert(result.directories.length === 2);
			done();
		});
	},

	"should provide an uri property on Directory items": function(done) {
		this.api.query(ROOT_URL, function(err, result) {
			assert.defined(result.directories[0].uri);
			done();
		});
	},

	"should provide an uri property on Directory items combined of parent's URI and the item's key attribute": function(done) {
		this.api.query("/library/sections", function(err, result) {
			assert.equals("/library/sections/1", result.directories[0].uri);
			done();
		});
	}
});