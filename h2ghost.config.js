const
	constants = require('constants'),
	fs = require('fs')

/* Required Section */

// If Ghost is installed in the same machine,
//	uncomment and fill out below line,
//	else leave it empty.
let ghost = {
	start: 'npm', // proxy | npm | <empty>
	mode: '', // production | development | testing. Default: <empty>

	dir: '/Volumes/HD2/JS/Downloads/code/ghost/ghost',

	// If `dir` empty, use following
	urlHost: '',
	urlPort: 443,
	server: {}
}

let cert = {
	key: fs.readFileSync('/Volumes/HD2/JS/code/_cert/server.key'),
	cert: fs.readFileSync('/Volumes/HD2/JS/code/_cert/server.crt'),
	//ca: fs.readFileSync(''),
}

/* Optional Section */

let optional = {

	// HTTP to HTTPS redirect
	//	eg. http://example.com -> https://example.com
	httpRedirect: true,
	httpRedirectPermanent: false,
	httpPort: 8080,

	// HTTPS url redirect
	//	eg. https://www.<url> -> https://<url>
	// 	This is only useful if your certificate support all
	// 	the domains/sub-domains pointing to this site.
	httpsRedirect: true,
	httpsRedirectPermanent: false,

	// Cluster
	cluster: false,
	workers: 4,

	hpkp: {},
	hsts: {},

}

// HTTP2/SPDY Options
let h2Options = Object.assign(
	cert,
	{
		secureOptions: constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
		ciphers: [
			'ECDHE-ECDSA-AES256-GCM-SHA384',
			'ECDHE-RSA-AES256-GCM-SHA384',
			'ECDHE-ECDSA-AES128-GCM-SHA256',
			'ECDHE-RSA-AES128-GCM-SHA256',
			"HIGH",
			"!aNULL",
			"!eNULL",
			"!EXPORT",
			"!DES",
			"!RC4",
			"!MD5",
			"!PSK",
			"!SRP",
			"!CAMELLIA"
		].join(':'),
		// SPDY(HTTP2) package specific option
		spdy: { protocols: ['h2', 'http/1.1'] }
	}
)

/* - - - NO CHANGE BELOW THIS LINE - - - */

let config = {
	h2Options: h2Options,
	ghost: ghost,
	optional: optional,
	startDelay: (ghost.server.socketPath && ghost.start != npm) ? 20 : 0
}

module.exports = config
