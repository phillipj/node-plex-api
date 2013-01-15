node-plex-api
=============

Small node module used to query the Plex Media Server HTTP API.
Translates the XML given from the server to JSON.

# Example
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

# API
For more information about the API capabilities, see the [HTTP/API Control description](http://wiki.plexapp.com/index.php/HTTP_API/Control) at plexapp.com