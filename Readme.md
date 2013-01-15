# plex-api

Small module used to query the Plex Media Server HTTP API.
Translates the XML given from the server to JSON.

## Usage

** query() : Retrieve content from an URI **
```js
var PlexAPI = require("plex-api");
var client = new PlexAPI("192.168.0.1");

client.query("/", function (error, result) {
	if (err) {
		throw new Error("Could not connect to server");
	}

	result.attributes; // MediaContainer attributes
	result.directories; // array of Directory items
});
```
** perform() : Perform library update of section of key "1" **
When performing an "action" on the HTTP API, the response body will be empty.
As the response content itself will be worthless, perform() acts on the HTTP status codes the server responds with.

```js
var PlexAPI = require("plex-api");
var client = new PlexAPI("192.168.0.1");

client.perform("/library/sections/1/refresh", function (error, result) {
	if (err) {
		throw new Error("Could not connect to server");
	}

	if (result) {
		// successfully started to refresh library section #1
	}
});
```

## HTTP API Documentation
For more information about the API capabilities, see the [HTTP/API Control description](http://wiki.plexapp.com/index.php/HTTP_API/Control) at plexapp.com