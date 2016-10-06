## Change log

### v4.0.0

#### Added
- Support for managed users by @hyperlink [#70](https://github.com/phillipj/node-plex-api/pull/70) <br>
  By specifying `options.managedUser` when creating a plex-api client, see more in [Readme.md](./Readme.md).

  [About managed users on support.plex.tv](https://support.plex.tv/hc/en-us/articles/203948776-Managed-Users).

#### BREAKING CHANGE

Requires at least Node.js v4.0.

### v3.5.0

#### Added
- Added support for PUT queries with .putQuery() by @IonicaBizau [#61](https://github.com/phillipj/node-plex-api/pull/61)

### v3.4.0

#### Added
- Added timeout option to control timeout on subsequent requests by @lokenx [#60](https://github.com/phillipj/node-plex-api/pull/60)

#### Updates
- xml2js from v0.4.15 to v0.4.16
- request from v2.67.0 to v2.69.0

### v3.3.0

#### Added
- Add support for extra headers in all of the query() related methods by @OverloadUT [#48](https://github.com/phillipj/node-plex-api/pull/48)
- Add support for `https` parameter to force https even on non-443 port by @OverloadUT [#47](https://github.com/phillipj/node-plex-api/pull/47)

#### Fixed
- Enabling gzip to fix a bug in some versions of PMS/PHT that silently fail when no Accept-Encoding header is sent by @OverloadUT [#51](https://github.com/phillipj/node-plex-api/pull/51)

### v3.2.0
- Added `options.token` to specify authentication token at PlexAPI client instantiation by @MikeOne
- Made responses with status code 2xx considered successfull, not just 200 by @MikeOne

### v3.1.2
- Fixed XML parsing by @phillipj

### v3.1.1
- Fixing broken authentication blooper by @phillipj

### v3.1.0

- Extensible authentication mechanisms by @phillipj
- Extracted HTTP headers generation into [plex-api-headers](https://www.npmjs.com/package/plex-api-headers) for re-use by @phillipj

### v3.0.0
- Change xml2json to xml2js by @OverloadUT

#### BREAKING CHANGE

Some of URIs on the Plex Server responds with XML instead of JSON. Previous versions of plex-api used xml2json to translate between XML to JSON. We have now replaced xml2json with xml2js which might result in a different JSON format when requesting URIs responding with XML.

Please see the documentation of [xml2json](https://github.com/buglabs/node-xml2json) and [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js) for more details about their differences.

### v2.5.0
- Updated the readme to explain each of the X-Plex headers by @OverloadUT
- The X-Plex headers are now sent on every request by @OverloadUT
- Added missing X-Plex headers: deviceName, platformVersion by @OverloadUT
- Updated the default X-Plex headers to be a bit more descriptive by @OverloadUT

### v2.4.0
- Added `postQuery()` to perform POST requests by @OverloadUT

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
