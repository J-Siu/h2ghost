const
	constants = require('constants'),
	fs = require('fs')

/*--- Required Section ---*/

const ghost = {
	/* Ghost start mode:
	'' - Do not start Ghost. h2ghost use proxy to access Ghost.
	'app' - h2ghost will Start Ghost as backend server, but use Ghost's express rootApp directly.
	'backend' - h2ghost will start Ghost as backend server, and use proxy to access it.
	*/
	start: 'app',

	/* Ghost start env, will also affect h2ghost.
	- Override NODE_ENV.
	- Override by command line option.
	'production' | 'development' | 'testing'
	*/
	env: 'production',

	/* Ghost's installation directory,
		or location of Ghost's config file.
		It is in following task:
		- Starting Ghost
		- Automatic configure proxy parameter
	*/
	dir: '/home/ghost/ghost',

	/* If `dir` empty, fill in 'url' and 'server' manually, otherwise can be left empty.

	'url' -
		This should have the same value the 'url' in Ghost's config.

	'server' -
		Same format as in Ghost's config.js.
		If h2ghost and Ghost are running in the same server,
			this should be the same as 'server' in Ghost's config.
		If Ghost is running in another server,
			'server' should point to it accordingly.
	*/
	url: '',
	server: {}
}

/* cert
This is the certificate object, same formate as https package.
*/
const cert = {
	key: fs.readFileSync(''),
	cert: fs.readFileSync(''),
	//ca: fs.readFileSync(''),
	//pfs: fs.readFileSync('')
}

/*--- Optional Section ---*/

const optional = {
	/* HTTP to HTTPS redirect
		eg. http://example.com -> https://example.com
	*/
	httpRedirect: false,
	httpRedirectPermanent: false,
	httpPort: 80,

	/* HTTPS url redirect
		eg. https://www.<url> -> https://<url>
	 	This is only useful if your certificate support all
	 	the domains/sub-domains pointing to this site.
	*/
	httpsRedirect: false,
	httpsRedirectPermanent: false,

	/* Cluster *Experimental*
		h2ghost will start multiple copies of http2 front end,
			and use proxy to access Ghost server.
		ghost.start cannot be 'app'.
	*/
	cluster: false,
	workers: 4,
}

/*--- HTTP2/SPDY Options ---*/
const h2Options = {
	cert: cert,
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
}


/* - - - NO CHANGE BELOW THIS LINE - - - */

module.exports = {
	h2Options: h2Options,
	ghost: ghost,
	optional: optional
}
