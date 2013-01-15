# plex-api

Small module used to query the Plex Media Server HTTP API.
Translates the XML given from the server to JSON.

## Usage

**query() : Retrieve content from an URI**
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

**perform() : Perform library update of section of key "1"**
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

## License
(The MIT License)

Copyright (c) 2013 Phillip Johnsen <phillip@lightweight.no>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.