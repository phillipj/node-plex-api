# plex-api [![Build Status](https://api.travis-ci.org/phillipj/node-plex-api.png)](http://travis-ci.org/phillipj/node-plex-api)

Small module which helps you query the Plex Media Server HTTP API.

## Usage

**PlexAPI(options | hostname)**

Instantiate a PlexAPI client.

Options:
- **hostname**: hostname where Plex Server runs
- **port**: port number Plex Server is listening on (optional, default: 32400)
- **username**: plex.tv username (optional / required for PlexHome)
- **password**: plex.tv password (optional / required for PlexHome)
- **options**: override additional PlexHome options (optional for PlexHome)
	- **identifier**: client identifier, default `generated uuid v4`
	- **product**: default `App`
	- **version**: default `1.0`
	- **device**: default `App`

If argument is a `string` it is used as the hostname.

For those who has PlexHome enabled on their server, will have to specify their username and password used at plex.tv.

**query(uri) : Retrieve content from URI**

Aside from requesting the API and returning its response, an `.uri` property are created to easier follow the URIs available in the HTTP API. At the moment URIs are attached for Directory and Server items.

```js
var PlexAPI = require("plex-api");
var client = new PlexAPI("192.168.0.1");

client.query("/").then(function (result) {
	console.log("%s running Plex Media Server v%s",
		result.friendlyName,
		result.version);

	// array of children, such as Directory or Server items
	// will have the .uri-property attached
	console.log(result._children);
}, function (err) {
	throw new Error("Could not connect to server");
});
```

**postQuery(uri) : Send a POST request and retrieve the response**

This is identical to ```query(uri)```, except that the request will be a POST rather than a GET. 

Note that the parameters can only be passed as a query string as part of the uri, which is all Plex requires. (```Content-Length``` will always be zero)

```js
var PlexAPI = require("plex-api");
var client = new PlexAPI("192.168.0.1");

client.postQuery("/playQueue?type=video&uri=someuri&shuffle=0'").then(function (result) {
	console.log("Added video to playQueue %s",
		result.playQueueID);

	// array of children, such as Directory or Server items
	// will have the .uri-property attached
	console.log(result._children);
}, function (err) {
	throw new Error("Could not connect to server");
});
```

**perform(uri) : Perform an API action**

When performing an "action" on the HTTP API, the response body will be empty.
As the response content itself is worthless, `perform()` acts on the HTTP status codes the server responds with.

```js
var PlexAPI = require("plex-api");
var client = new PlexAPI("192.168.0.1");

// update library section of key "1"
client.perform("/library/sections/1/refresh").then(function () {
	// successfully started to refresh library section #1
}, function (err) {
	throw new Error("Could not connect to server");
});
```

**find(uri, [{criterias}]) : Find matching child items on URI**

Uses `query()` behind the scenes, giving all directories and servers the beloved `.uri` property.

```js
var PlexAPI = require("plex-api");
var client = new PlexAPI("192.168.0.1");

// filter directories on Directory attributes
client.find("/library/sections", {type: "movie"}).then(function (directories) {
	// directories would be an array of sections whose type are "movie"
}, function (err) {
	throw new Error("Could not connect to server");
});

// criterias are interpreted as regular expressions
client.find("/library/sections", {type: "movie|shows"}).then(function (directories) {
	// directories type would be "movie" OR "shows"
}, function (err) {
	throw new Error("Could not connect to server");
});

// shorthand to retrieve all Directories
client.find("/").then(function (directories) {
	// directories would be an array of Directory items
}, function (err) {
	throw new Error("Could not connect to server");
});
```

## HTTP API Documentation
For more information about the API capabilities, see the [unofficial Plex API documentation](https://code.google.com/p/plex-api/w/list).

## Running tests
```shell
$ npm test
```
## Contributing

Contributions are more than welcome! Create an issue describing what you want to do. If that feature is seen to fit this project, send a pull request with the changes accompanied by tests.

## Changelog

### v2.3.0
- PlexHome authentication if needed when calling `.perform()` as with `.query()`, by @OverloadUT

### v2.2.0
- Convert to JSON or XML according to server response header, or resolve with raw server response buffer. This allows for image buffers to be fetched. By @YouriT

### v2.1.0
- Add ability to define app options by @DMarby

### v2.0.1
- Bugfix for wrong `.uri` in some cases by @pjeby

### v2.0.0
- PlexHome support
- Deprecated port argument of PlexAPI constructor in favor of an options object
- Retrieves JSON from the Plex HTTP API instead of XML **see breaking changes below!**

#### BREAKING CHANGES FROM v1.0.0 AND BELOW

We're now retrieving JSON from the Plex HTTP API instead of XML, which got translated to JSON by this module. Direct consequences:
- Attributes previously found in `result.attributes` are now available directly in `result`
- Child items such as Directory and Server has moved from e.g. `result.directory` to `result._children`

```js
client.query("/").then(function (result) {
	console.log(result.friendlyName); // was result.attributes.friendlyName
	console.log("Directory count:", result._children.length); // was result.directory.length
});
```

### v1.0.0
v1.0.0 mostly to be a better semver citizen and some housekeeping.

### v0.4.2
- Updated dependencies
- Housekeeping with some minor code refactor

### v0.4.1
- Bugfix for not releasing HTTP agent sockets properly on .perform()

### v0.4.0
- Converted all methods to return promises, rather than accepting callback as argument
- Converted buster tests to mocha/expect.js

### v0.2.3
- .find() matches attribute values by regular expression
- Added getters for hostname and port
- Made constructor hostname parameter required

### v0.2.2
- Bugfix for .find() only working when having Directory items

### v0.2.1
- Generalized URI resolving as bugfix for other types of items than Directories
- Added URIs for Server items

### v0.2.0
- **important** Removed explicit XML to JSON conversion to ensure consistent child item names. The main difference for those using previous module versions, is the need to change their use of result.directories to result.directory.

## License
(The MIT License)

Copyright (c) 2013-2015 Phillip Johnsen &lt;phillip@lightweight.no&gt;

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
