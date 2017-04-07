// HTTP2
const
	http2 = require('spdy'), // use spdy to support http2
	express = require('express'),
	helmet = require('helmet'),
	proxy = require('http-proxy')

function H2Ghost() {
	this.conf = require('./h2ghost.config.js')
	this.printConf = false

	// Set ENV
	this.setEnv = function () {
		console.log('setEnv')

		// Ignore node version
		process.env.GHOST_NODE_VERSION_CHECK = false

		// Default to 'development' if !NODE_ENV
		if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development'

		// Config file override NODE_ENV
		if (this.conf.ghost.env && this.conf.ghost.env.length > 0)
			process.env.NODE_ENV = this.conf.ghost.env

		// Cmd line override config file and NODE_ENV
		process.argv.forEach(arg => {
			switch (arg.toLowerCase()) {
				case '--pro':
				case '--prd':
				case '--prod':
				case '--production':
					process.env.NODE_ENV = 'production'
					break
				case '--tes':
				case '--test':
				case '--testing':
					process.env.NODE_ENV = 'testing'
					break
				case '--dev':
				case '--development':
					process.env.NODE_ENV = 'development'
					break
				case '--con':
				case '--conf':
				case '--config':
					this.printConf = true
					break
			}
		})

		this.conf.ghost.env = process.env.NODE_ENV

	}

	// Config Ghost parameter used by H2Ghost
	this.setH2GhostParam = function () {
		console.log('setH2GhostParam')

		const
			url = require('url').URL,
			// use short hand
			tcg = this.conf.ghost,
			tco = this.conf.optional

		if (tcg.dir === './') tcg.dir = __dirname

		tcg.start = tcg.start.toLowerCase()

		if (tcg.start === 'app' && tco.cluster)
			console.log("h2ghost.config.js ghost.start='app' cannot be used with optional.cluster=true")

		// Are we starting Ghost? Which mode?
		if (tcg.start && tcg.start.length > 0) {
			if (tcg.start === 'app')
				tcg.startApp = true
			else if (tcg.start === 'backend')
				tcg.startBackend = true
			else
				console.log(`h2ghost.config.js ghost.start invalid value: ${tcg.start}`)
		}

		// Confinue with auto config if `ghost.dir` is available
		if (tcg.dir && tcg.dir.length > 0) {
			const
				path = require('path'),
				conf = require(path.join(tcg.dir, 'config.js'))[tcg.env],
				urlObj = new url(conf.url)

			tcg.urlHost = urlObj.host
			tcg.urlPort = (!urlObj.port || urlObj.port === '') ? 443 : urlObj.port

			// If using proxy, setup ghost server info
			if (conf.server.host)
				tcg.server = {
					host: conf.server.host,
					port: conf.server.port
				}
			else tcg.server = { socketPath: conf.server.socket.path }
		} else {
			// Manual config
			const
				urlObj = new url(tcg.url)

			tcg.urlHost = urlObj.host
			tcg.urlPort = (!urlObj.port || urlObj.port === '') ? 443 : urlObj.port
		}

		// Set h2 server startDelay in ms
		this.conf.startDelay = (tcg.server.socket && !tcg.app) ? 20 * 1000 : 0
	}

	// Start Ghost
	this.startGhost = function (ex) {
		console.log('startGhost: Starting')

		const
			app = (ex) ? ex : express(),
			ghost = require(`${this.conf.ghost.dir}/core`),
			errors = require(`${this.conf.ghost.dir}/core/server/errors`)

		ghost().then((ghostServer) => {
			console.log(`startGhost: Done`)
			app.use(ghostServer.config.paths.subdir, ghostServer.rootApp)
			ghostServer.start(app) // Cannot get rid of this
		}).catch(function (err) {
			errors.logErrorAndExit(err, err.context, err.help)
		})
	}

	// Create http-proxy if proxy mode is used
	this.startProxy = function (ex) {
		console.log('startProxy')
		const
			options = {
				target: this.conf.ghost.server,
				xfwd: true
			},
			px = proxy.createProxyServer(options)
		ex.all('*', (req, res) => px.web(req, res))
	}

	this.setupHelmet = function (ex) {

		console.log('setupHelmet')

		const tch = this.conf.helmetOptions // use shorthand

		if (tch.hidePoweredBy) ex.set('x-powered-by', false)
		if (tch.ieNoOpen) ex.use(helmet.ieNoOpen())
		if (tch.noCache) ex.use(helmet.noCache())
		if (tch.noSniff) ex.use(helmet.noSniff())
		if (tch.dnsPrefetchControl) ex.use(helmet.dnsPrefetchControl())
		if (tch.xssFilter) ex.use(helmet.xssFilter())

		if (tch.contentSecurityPolicy) ex.use(helmet.contentSecurityPolicy(tch.contentSecurityPolicy))
		if (tch.frameguard) ex.use(helmet.frameguard(tch.frameguard))
		if (tch.referrerPolicy) ex.use(helmet.referrerPolicy(tch.referrerPolicy))
		if (tch.hsts) ex.use(helmet.xssFilter(tch.hsts))
		if (tch.hpkp) ex.use(helmet.xssFilter(tch.hpkp))
	}

	/* setupExpress */
	this.setupExpress = function () {

		console.log('setupExpress')

		const ex = express()

		// Use Helmet
		this.setupHelmet(ex)

		// HTTPS redirect
		if (this.conf.optional.httpsRedirect) {
			const redirectCode = (this.conf.optional.httpRedirectPermanent) ? 308 : 307
			ex.all('*', (req, res, next) => {
				if (req.headers.host != this.conf.ghost.urlHost) {
					res.writeHead(redirectCode, { 'location': `https://${this.conf.ghost.urlHost}${req.url}` });
					res.end()
				} else next()
			})
		}

		// Mount APP or Proxy
		if (this.conf.ghost.startApp)
			this.startGhost(ex)
		else
			this.startProxy(ex)

		return ex
	}

	// Start H2 Server
	this.startH2Server = function () {
		console.log('startH2Server')
		const ex = this.setupExpress()
		http2.createServer(this.conf.h2Options, ex)
			.listen(this.conf.ghost.urlPort, '0.0.0.0');
	}

	this.startHttpRedirect = function () {
		console.log('startHttpRedirect')
		const
			http = require('http'),
			redirectCode = (this.conf.optional.httpRedirectPermanent) ? 308 : 307
		http.createServer((req, res) => {
			res.writeHead(redirectCode, { 'location': `https://${this.conf.ghost.urlHost}${req.url}` })
			res.end()
		}).listen(this.conf.optional.httpPort, '0.0.0.0');
	}

	this.start = function () {
		// Cluster??
		if (this.conf.optional.cluster) {
			// Cluster: true
			console.log('Cluster')

			const cluster = require('cluster')

			if (cluster.isMaster) {
				// Cluster Master
				console.log('Cluster:Master')

				if (this.conf.ghost.startBackend) this.startGhost()

				setTimeout(() => {
					for (let i = 0; i < this.conf.optional.workers; i++) {
						console.log(i)
						cluster.fork()
					}
				}, this.conf.startDelay)

				if (this.conf.optional.httpRedirect) this.startHttpRedirect()

			} else {
				// Cluster Worker
				console.log('Cluster:Worker')
				// Flow: startH2Server -> setupExpress -> startProxy
				this.startH2Server()
			}
		} else {
			// Cluster: false
			if (this.conf.ghost.startApp)
				// Flow: startH2Server -> setupExpress -> startGhost(ex)
				this.startH2Server()
			else {
				if (this.conf.ghost.startBackend) this.startGhost()
				// Flow: startH2Server -> setupExpress -> startProxy
				setTimeout(() => this.startH2Server(), this.conf.startDelay)
			}

			if (this.conf.optional.httpRedirect) this.startHttpRedirect()

		}
	}

	// Constructor
	this.setEnv()
	this.setH2GhostParam()
	if (this.printConf) console.log(this.conf)
}

const h2ghost = new H2Ghost()
h2ghost.start()
