var buster = require("buster");
var server = require("./server");

var ROOT_URL = "/";
var PERFORM_URL = "/library/sections/1/refresh";

var PlexAPI = require("..");

buster.testCase("API module", {
	setUp: function() {
		server.start();
		this.api = new PlexAPI("localhost");
	},

	tearDown: function() {
		try {
			server.stop();
		} catch (ignoredException) {}
	},

	"module exposes constructor": function() {
		assert.isFunction(PlexAPI);
	},

	"should be instance of the PlexAPI": function() {
		assert(this.api instanceof PlexAPI);
	},

	"should have configurable server port": function(done) {
		this.api = new PlexAPI("localhost", 32401);
		server.stop();
		server.start(32401);

		this.api.query(ROOT_URL, function(err, result) {
			assert.isObject(result);
			done();
		});
	},

	"query()": {
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
		}
	},

	"perform()": {
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
	}
});