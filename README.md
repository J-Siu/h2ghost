# Ghost Https Nodejs Proxy

<!-- TOC -->

- [Installation](#installation)
	- [Requirement](#requirement)
	- [Enable nodejs to open port 80 and 443 in Linux](#enable-nodejs-to-open-port-80-and-443-in-linux)
- [Usage](#usage)
- [Configuration](#configuration)
	- [Ghost Section (Required)](#ghost-section-required)
	- [Certificate Section (Required)](#certificate-section-required)
	- [Optional Section](#optional-section)
		- [HTTP to HTTPS redirect](#http-to-https-redirect)
		- [HTTPS URL redirect](#https-url-redirect)
		- [Cluster *Experimental*](#cluster-experimental)
- [Changelog](#changelog)
- [License](#license)

<!-- /TOC -->

## Installation

```
git clone https://github.com/J-Siu/h2ghost.git
cd h2ghost
npm i
```

### Requirement

>Node.js v7.x or above.

### Enable nodejs to open port 80 and 443 in Linux

To enable nodejs (non-root) to open port below 1024, issue following command:

`sudo setcap 'cap_net_bind_service=+ep' /usr/bin/nodejs`

## Usage

```
node h2ghost
```

Set `NODE_ENV` with command line option:
```
node h2ghost --production
node h2ghost --development
node h2ghost --testing
```

Print out calculated configuration:
```
node h2ghost --config --production
```

## Configuration

All configuration options are in `h2ghost.config.js`.

### Ghost Section (Required)

```javascript
const ghost = {
	start: 'app',
	env: 'production',
	dir: '/home/ghost/ghost',
	url: '',
	server: {}
}
```

`start` - Ghost start mode.

Value: '' | 'app' | 'backend'

-	'' - Do not start Ghost. h2ghost use proxy to access Ghost.
-	'app' - h2ghost will Start Ghost as backend server, but use Ghost's express rootApp directly.
-	'backend' - h2ghost will start Ghost as backend server, and use proxy to access it.

`env` - Ghost start env, will also affect h2ghost.

Value: 'production' | 'development' | 'testing'

- Override NODE_ENV.
- Override by command line option.

`dir` - Ghost's installation directory,	or location of Ghost's config file. It is in for starting Ghost and automatic configuring the `url` and `server` parameters.

Value: '' | '<Ghost installation directory>'

    If `dir` is left empty, 'url' and 'server' must be filled manually, otherwise can be left empty.

`url` - This should have the same value the 'url' in Ghost's config.

`server` - Same format as in Ghost's config.js.

    If h2ghost and Ghost are running in the same server, this should be the same as `server` in Ghost's config.

    If Ghost is running in another server,	`server` should point to it accordingly.

### Certificate Section (Required)

Fill in certificate file paths.

```javascript
const cert = {
	key: fs.readFileSync(''),
	cert: fs.readFileSync(''),
	//ca: fs.readFileSync(''),
	//pfs: fs.readFileSync('')
}
```

### Optional Section
```javascript
const optional = {
	httpRedirect: false,
	httpRedirectPermanent: false,
	httpPort: 80,

	httpsRedirect: false,
	httpsRedirectPermanent: false,

	cluster: false,
	workers: 4,
}
```

#### HTTP to HTTPS redirect

eg. http://example.com -> https://example.com

`httpRedirect`: false(default) | true
`httpRedirectPermanent`: false(default) | true
`httpPort`: 80

#### HTTPS URL redirect

eg. https://www.<url> -> https://<url>

> This is only useful if your certificate support all the domains/sub-domains pointing to this site.

`httpsRedirect`: false(default) | true
`httpsRedirectPermanent`: false(default) | true

#### Cluster *Experimental*

h2ghost will start multiple copies of http2 front end, and use proxy to access Ghost server.

> ghost.start cannot be 'app'

`cluster`: false(default) | true
`workers`: 4

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
- 0.3.1
	- `h2ghost.js` restructured to use `expressjs`.
	- `h2ghost.config.js` restructured and simplified.
	- `README.md` updated.

## License

The MIT License

Copyright (c) 2017

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
