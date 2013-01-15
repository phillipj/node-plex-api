var request = require("request");
var xml2json = require("xml2js");

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
		if (err) {
			return callback(err);
		}

		callback(null, {
			attributes: json.MediaContainer.$,
			directories: json.MediaContainer.Directory
		});
	});
};

function retrieveJsonFromUrl(relativeUrl, callback) {
	request(this.serverUrl + relativeUrl, function(err, response, xml) {
		if (err) {
			return callback(err);
		}

		convertXmlToJson(xml, function(convertError, json) {
			callback(convertError, json);
		});
	});
}

function convertXmlToJson(xml, callback) {
	var parser = new xml2json.Parser();
	parser.parseString(xml, function(err, result) {
		callback(err, result);
	});
}