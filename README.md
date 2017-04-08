# H2Ghost

Nodejs HTTP2 / HTTPS / PROXY for Ghost Blog.

`h2ghost` is a http2 front end for Ghost Blog, either via proxy or using Ghost's rootApp directly.

It can be used as Ghost Blog start up wrapper.

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
	- [Helmet Options Section](#helmet-options-section)
	- [HTTP2 Options Section](#http2-options-section)
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

Node.js v7.x or above.

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
	server: {},
	socketDelay: 20
}
```

`start` - Ghost start mode.

Value: '' | 'app' | 'backend'

-	`''` - Do not start Ghost. h2ghost use proxy to access Ghost.
-	`'app'` - h2ghost will Start Ghost as backend server, but use Ghost's express rootApp directly.
-	`'backend'` - h2ghost will start Ghost as backend server, and use proxy to access it.

If `'backend'` is choosen, and Ghost use unix socket, the `socket.path` in Ghost's config.js has to be full path, or prefix the relative path with `__dirname` like following:

```javascript
config = {
	production: {
		/* ... snip ... */
		server: {
			socket: {
				path: __dirname + './ghost.sock',
				permissions: '0600'
			}
		}
	}
}
```

`env` - Ghost start env, will also affect h2ghost.

Value: `'production'` | `'development'` | `'testing'`

- Override NODE_ENV.
- Override by command line option.

`dir` - Ghost's installation directory,	or location of Ghost's config file. It is in for starting Ghost and automatic configuring the `url` and `server` parameters.

Value: `''` | `'<Ghost installation directory>'`

>If `dir` is left empty, 'url' and 'server' must be filled manually, otherwise can be left empty.

`url` - This should have the same value the `'url'` in Ghost's config.

`server` - Same format as in Ghost's config.js.

`socketDelay` - If backend Ghost use unix socket, delay frontend start in second. Default 20sec.

>If h2ghost and Ghost are running in the same server, this should be the same as `server` in Ghost's config.

>If Ghost is running in another server,	`server` should point to it accordingly.

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

H2Ghost optional features.

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

`httpRedirect`: `false` (default) | `true`

`httpRedirectPermanent`: `false` (default) | `true`

`httpPort`: 80

#### HTTPS URL redirect

eg. Redirect `https://somedomain.com/urlpath` to `https://YourDomain.com/urlpath`

> This is only useful if your certificate support all the domains/sub-domains pointing to this site.

`httpsRedirect`: `false` (default) | `true`

`httpsRedirectPermanent`: `false` (default) | `true`

#### Cluster *Experimental*

h2ghost will start multiple copies of http2 front end, and use proxy to access Ghost server.

> ghost.start cannot be 'app'

`cluster`: `false` (default) | `true`

`workers`: 4

### Helmet Options Section

`h2ghost.config.js` support configuration of `Helmet` through the `helmetOptions` block.

All helmet features are controlled individually. Following is the default configuration:

```javascript
const helmetOptions = {
	hidePoweredBy: true,
	ieNoOpen: true,
	noSniff: true,

	dnsPrefetchControl: false,
	noCache: false,
	xssFilter: false,

	//contentSecurityPolicy: {},
	//frameguard: {},
	//referrerPolicy: {},
	//hsts: {},
	//hpkp: {}
}
```

The block can be devided into two categories.

Helmet features in following table control by `true` (on) or `false` (off).

Helmet Option | Configuration | Config Reference & Notes
---|---|---
hidePoweredBy|boolean|[Helmet Ref.](https://helmetjs.github.io/docs/hide-powered-by/)
ieNoOpen|boolean|[Helmet Ref.](https://helmetjs.github.io/docs/ienoopen/)
noSniff|boolean|[Helmet Ref.](https://helmetjs.github.io/docs/dont-sniff-mimetype/)
dnsPrefetchControl|boolean|[Helmet Ref.](https://helmetjs.github.io/docs/dns-prefetch-control)
noCache|boolean|[Helmet Ref.](https://helmetjs.github.io/docs/frameguard/)
xssFilter|boolean|[Helmet Ref.](https://helmetjs.github.io/docs/xss-filter/)

Helmet features in following table require configuration object. Enable them by uncommenting and filling in the configuration object. Pleae refer to links in reference column for configuration format.

> ONLY UNCOMMENT FEATURES YOU ARE USING.

Helmet Option | Configuration | Config Reference & Notes
---|---|---
contentSecurityPolicy|{object}|[Helmet Ref.](https://helmetjs.github.io/docs/csp/)
frameguard|{object}|[Helmet Ref.](https://helmetjs.github.io/docs/frameguard/)
referrerPolicy|{object}|[Helmet Ref.](https://helmetjs.github.io/docs/referrer-policy/)
hsts|{object}|*Medium Risk* : This will lock your domain to HTTPS ONLY in client browser. Make sure you understand throughly before enabling HSTS!! [Helmet Ref.](https://helmetjs.github.io/docs/hsts/), [Wikipedia](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security)
hpkp|{object}|*HIGH RISK* : IF SETUP WRONG,	THIS HAS THE POTENTIAL TO LOCK YOUR SITE/DOMAIN OUT OF CLIENT BROWSER FOR A LONG TIME! DON'T USE IT, UNLESS YOU UNDERSTAND IT!! [Helmet Ref.](https://helmetjs.github.io/docs/hpkp/), [Wikipedia](https://en.wikipedia.org/wiki/HTTP_Public_Key_Pinning), [Scott Helme's blog on HPKP](https://scotthelme.co.uk/hpkp-http-public-key-pinning/)

### HTTP2 Options Section

These are the options used to setup https/http2 and should not require modification in most cases.

```javascript
const h2Options = Object.assign(
	cert,
	{
		secureOptions: constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
		ciphers: [
			'ECDHE-ECDSA-AES256-GCM-SHA384',
			'ECDHE-RSA-AES256-GCM-SHA384',
			'ECDHE-ECDSA-AES128-GCM-SHA256',
			'ECDHE-RSA-AES128-GCM-SHA256',
			'HIGH',
			'!aNULL',
			'!eNULL',
			'!EXPORT',
			'!DES',
			'!RC4',
			'!MD5',
			'!PSK',
			'!SRP',
			'!CAMELLIA'
		].join(':'),
		// SPDY(HTTP2) package specific option
		spdy: { protocols: ['h2', 'http/1.1'] }
	})
```

Config References:
- [secureOptions](https://nodejs.org/api/crypto.html#crypto_openssl_options)
- [ciphers](//nodejs.org/api/tls.html#tls_modifying_the_default_tls_cipher_suite)
- [spdy](//github.com/spdy-http2/node-spdy)


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
- 0.3.2
	- Support `helmet` configuration in `h2ghost.config.js`.

## License

The MIT License

Copyright (c) 2017

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
