var request = require("request");
var xml2json = require("xml2js");
var http = require("http");
var uri = require("./uri");
var Q = require('q');

var PLEX_SERVER_PORT = 32400;

module.exports = PlexAPI;

function PlexAPI(hostname, port) {
	this.hostname = hostname;
	this.port = port || PLEX_SERVER_PORT;

	if (typeof hostname !== "string") {
		throw new TypeError("Invalid server hostname");
	}

	this.serverUrl = "http://" + hostname + ":" + this.port;
}

PlexAPI.prototype.getHostname = function() {
	return this.hostname;
};

PlexAPI.prototype.getPort = function() {
	return this.port;
};

PlexAPI.prototype.query = function(url) {
	if (url === undefined) {
		throw new TypeError("Requires url argument");
	}

	return retrieveJsonFromUrl.call(this, url).then(function(result) {
		uri.attach(url, result);
		return result;
	});
};

PlexAPI.prototype.perform = function(relativeUrl) {
	var deferred = Q.defer();
	var url;

	if (relativeUrl === undefined) {
		throw new TypeError("Requires url argument");
	}

	url = generateRelativeUrl.call(this, relativeUrl);
	http.get(url, function(res) {
		if (res.statusCode !== 200) {
			return deferred.reject(new Error("Server didnt respond with status code 200, response: " + res.statusCode));
		}

		deferred.resolve();
	}).on("error", function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
};

PlexAPI.prototype.find = function(relativeUrl, criterias) {
	if (relativeUrl === undefined) {
		throw new TypeError("Requires url argument");
	}

	return this.query(relativeUrl).then(function(result) {
		var allChildren = getChildrenOfResult(result);
		return filterChildrenByCriterias(allChildren, criterias);
	});
};

function getChildrenOfResult(result) {
	if (!result) { return []; }

	var item;
	var children = [];

	for (var itemName in result) {
		item = result[itemName];

		if (!result.hasOwnProperty(itemName)) { continue; }
		if (Array.isArray(item)) {
			children[itemName] = item;
		}
	}

	return children;
}

function filterChildrenByCriterias(children, criterias) {
	var matchedChildren;
	var filteredChildren = {};
	criterias = criterias || {};

	for (var childName in children) {
		if (!children.hasOwnProperty(childName)) { continue; }

		matchedChildren = children[childName].filter(function(child) {
			var isMatch = true;
			var regexToMatch;

			for (var rule in criterias) {
				regexToMatch = new RegExp(criterias[rule]);

				if (!criterias.hasOwnProperty(rule)) { continue; }
				if (!child.attributes || !regexToMatch.test(child.attributes[rule])) {
					isMatch = false;
					break;
				}
			}

			return isMatch;
		});

		if (matchedChildren.length > 0) {
			filteredChildren[childName] = matchedChildren;
		}
	}

	if (objectHasOnlyOneProperty(filteredChildren)) {
		filteredChildren = getFirstPropertyOf(filteredChildren);
	}

	return filteredChildren;
}

function retrieveJsonFromUrl(relativeUrl) {
	var deferred = Q.defer();
	var url = generateRelativeUrl.call(this, relativeUrl);

	request(url, function(err, response, xml) {
		if (err) {
			return deferred.reject(err);
		}

		convertXmlToJson(xml, function(convertError, json) {
			if (convertError) {
				return deferred.reject(convertError);
			}

			deferred.resolve(json);
		});
	});

	return deferred.promise;
}

function convertXmlToJson(xml, callback) {
	new xml2json.Parser({
		attrkey: "attributes",
		explicitRoot: false,
		normalizeTags: true
	}).parseString(xml, function(err, result) {
		callback(err, result);
	});
}

function generateRelativeUrl(relativeUrl) {
	return this.serverUrl + relativeUrl;
}

function objectHasOnlyOneProperty(object) {
	return Object.keys(object).length === 1;
}

function getFirstPropertyOf(object) {
	return object[Object.keys(object)[0]];
}