var request = require("request");
var xml2json = require("xml2js");
var http = require("http");

var PLEX_SERVER_PORT = 32400;

module.exports = PlexAPI;

function PlexAPI(hostname, port) {
	this.hostname = hostname;
	this.serverUrl = "http://" + hostname + ":" + (port || PLEX_SERVER_PORT);
}

PlexAPI.prototype.query = function(url, callback) {
	if (url === undefined) {
		throw new TypeError("Requires url argument");
	}
	if (callback === undefined) {
		throw new TypeError("Requires callback argument");
	}

	retrieveJsonFromUrl.call(this, url, function(err, json) {
		var result;

		if (!err) {
			result = {
				attributes: json.MediaContainer.attributes,
				directories: json.MediaContainer.Directory
			};
		}

		callback(err, result);
	});
};

PlexAPI.prototype.perform = function(relativeUrl, callback) {
	var url;

	if (relativeUrl === undefined) {
		throw new TypeError("Requires url argument");
	}
	if (callback === undefined) {
		throw new TypeError("Requires callback argument");
	}

	url = generateRelativeUrl.call(this, relativeUrl);
	http.get(url, function(res) {
		callback(null, res.statusCode === 200);
	}).on("error", function(err) {
		callback(err);
	});
};

function retrieveJsonFromUrl(relativeUrl, callback) {
	var url = generateRelativeUrl.call(this, relativeUrl);
	request(url, function(err, response, xml) {
		if (err) {
			return callback(err);
		}

		convertXmlToJson(xml, function(convertError, json) {
			callback(convertError, json);
		});
	});
}

function convertXmlToJson(xml, callback) {
	var parser = new xml2json.Parser({ attrkey: "attributes" });
	parser.parseString(xml, function(err, result) {
		callback(err, result);
	});
}

function generateRelativeUrl(relativeUrl) {
	return this.serverUrl + relativeUrl;
}