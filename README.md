# Ghost Https Nodejs Proxy

> *Usage* is only update to 0.2.0. A complete update will be available at 0.3.1.

- [Usage](#usage)
	- [Installing](#installing)
	- [Enable nodejs to open port 80 and 443 in Linux](#enable-nodejs-to-open-port-80-and-443-in-linux)
	- [Configuration](#configuration)
		- [Certificate](#certificate)
		- [URL](#url)
		- [HTTP to HTTPS Redirect](#http-to-https-redirect)
		- [HTTPS URL Redirect](#https-url-redirect)
		- [Cluster](#cluster)
	- [Start the proxy:](#start-the-proxy)
	- [Merge with Ghost `index.js`](#merge-with-ghost-indexjs)
		- [Ghost using IP](#ghost-using-ip)
		- [Ghost using Unix Socket](#ghost-using-unix-socket)
- [Changelog](#changelog)
- [License](#license)

## Usage

### Installing

```
git clone https://github.com/J-Siu/ghost-https-nodejs-proxy.git
cd ghost-https-nodejs-proxy
npm i
```

### Enable nodejs to open port 80 and 443 in Linux

To enable nodejs (non-root) to open port below 1024, issue following command:

`sudo setcap 'cap_net_bind_service=+ep' /usr/bin/nodejs`

### Configuration

All configuration options are in `http2-proxy.config.js`.

#### Certificate

Fill in certificate file paths.

```javascript
// Fill in your certificate files
const serverKey='';
const serverCrt='';
// Uncomment following line to use CA file.
//const serverCa = '';
```

If CA file is used, uncomment the ca line in `exports.httpsOptions`:

```javascript
exports.httpsOptions = {
	key: fs.readFileSync(serverKey),
	cert: fs.readFileSync(serverCrt),
	// ca: fs.readFileSync(serverCa), // Uncomment this line to use CA file
	ciphers: [
		"ECDHE-RSA-AES256-SHA384",
		"DHE-RSA-AES256-SHA384",
		"ECDHE-RSA-AES256-SHA256",
		"DHE-RSA-AES256-SHA256",
```

#### URL

URL of your site. This should match your Ghost `config.js` but without the `http://` or `https://` prefix.

```javascript
// The primay fqdn of the site.
exports.url = 'example.com';
```

#### HTTP to HTTPS Redirect

Enabling this will redirect all http traffic to https.

Example:
- http://example.com/* -> https://example.com/*

```javascript
exports.httpRedirect = true;
exports.httpPort = 80;
```

#### HTTPS URL Redirect

Enabling this will redirect all urls not matching `exports.url` above to be redirected.

Example:
- https://www.example.com -> https://example.com
- https://www.example.com/welcome -> https://example.com/welcome
- https://www.Other-Domein-Pointing-To-Your-Site.com -> https://example.com

>	This is only useful if your certificate support all	the domains/sub-domains pointing to this site.

```javascript
exports.httpsRedirect = true;
exports.httpsPort = 443;
```

#### Cluster

Cluster support. Number of `exports.workers` should at least 1 if enabled.

> WARNING: Cluster MUST BE DISABLED if you are going to merge `http2-proxy.js` with Ghost `index.js`. See [below](#merge-with-ghost-indexjs).

```javascript
exports.cluster = false;
exports.workers = 4;
```

### Start the proxy:

`node http2-proxy.js`

### Merge with Ghost `index.js`

In a single server setup, `http2-proxy.js` can be started within Ghost `index.js` to use the same node instance.

Put `http2-proxy.js` and `http2-proxy.config.js` into Ghost installation root.

> Cluster must be disabled in this setup!
> ```javascript
> exports.cluster = false;
> ```

#### Ghost using IP

If Ghost is running with IP (eg. default localhost:2368), add following line at the end of Ghost `index.js`.

```javascript
const proxy = require('./http2-proxy.js');
```

#### Ghost using Unix Socket

If Ghost is running with unix socket, add following line at the end of Ghost `index.js`.

```javascript
setTimeout( function() { var proxy=require('./http2-proxy.js'); }, 25000);
```

It will wait 25sec before starting `http2-proxy`, ensuring Ghost socket file is available.

## Changelog
- 0.1.0
	- Initial commit
- 0.1.1
	- HTTP2 support using SPDY
	- URL redirect for HTTPS
- 0.2.0
	- Use `http2-proxy.config.js` for configuration
	- Support clustering when run standalone
	- Support one-line merging with Ghost `index.js`
	- Use http-proxy `xfwd: true` flag instead of manual header settings
	- Use http api for redirect, remove Express dependency
- 0.3.0
	- Rename project to `h2ghost`
	- Phase 1 restructure of `h2ghost.js` and `h2ghost.config.js`.
	- `README.md` update delay to Phase 2 (next version)

## License

The MIT License

Copyright (c) 2017

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
