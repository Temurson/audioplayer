// @ts-check

/**
 * @file app.js
 *
 * Configures and exports an Express Application, but does not launch it.
 *
 * @see http://expressjs.com/ - Express Docs
 * @see index.js - launches the app
 */

// =============================================================================
// ================================== IMPORTS ==================================
// =============================================================================

import express from 'express'                       // Simple web server framework. http://expressjs.com/
import bodyParser from 'body-parser'                // Parses request bodies, making them available as `req.body`
import compression from 'compression'               // Compresses responses w/gzip, etc. https://npmjs.com/package/compression
import cookieParser from 'cookie-parser'            // Parses client cookies, making them available as `req.cookies`
import Debug from 'debug'                           // Small development debug logger. https://npmjs.com/package/debug
import morgan from 'morgan'                         // Logs info (e.g. status code) for each requests
import passport from 'passport'                     // Authentication management middleware. https://passportjs.com
import path from 'path'                             // File path utilities. https://nodejs.org/api/path.html
import session from 'express-session'               // Auth session storage. https://npmjs.com/package/express-session
import { nextTick } from 'process'



// =============================================================================
// =============================== CONFIGURATION ===============================
// =============================================================================

// const config = require('./config')
// const routes = require('./routes')
// require('./passport.config') // Configure passport. This doesn't export anything, it just runs setup logic.

const debug = Debug('app')
const { NODE_ENV } = process.env
const { MemoryStore } = session
const {
  PORT,
  DB_URL,
  COOKIE_MAX_AGE,
  SECRET
} = config
// Connect to our MongoDB instance



// =============================================================================
// ================================= APP SETUP =================================
// =============================================================================

const app = module.exports = express() // Create the express application

app.set('port', PORT)

// Set up server-side rendering
const layoutsDir = path.resolve(__dirname, 'views', 'layouts')
debug('layout directory: %s', layoutsDir)

app.use((req, res, next) => {
    console.log('Incoming request from client %s', req.ip)
    next()
})
// Mount global middleware
app.use(morgan('combined'))
// app.use('/static', express.static(path.resolve(__dirname, '../static')))
app.use(cookieParser(SECRET)) // Note: There will be issues if session and cookie-parser don't use the same secret
app.use(bodyParser.json())
app.use(session({
  secret: SECRET,
  // Don't force the session id to be resaved to the session store, even if it hasn't expired.
  resave: false,
  // Forces a session that is "uninitialized" to be saved to the store.
  // A session is uninitialized when it is new but not modified.
  saveUninitialized: true,
  store: NODE_ENV === 'development'
    ? new MemoryStore()
    : (function() { throw new Error('A production session store has not been configured.') })(),
  cookie: {
    httpOnly: true, // Client-side JavaScript can't access the session cookie
    secure: true,   // Don't send the cookie back if the client isn't connected over HTTPS
    maxAge: COOKIE_MAX_AGE,
  }
}))
// NOTE: these need to be mounted after cookie-parser and express-session
app.use(passport.initialize())
app.use(passport.session())
app.use(compression())

// Mount the routes. This must come after mounting middleware.
// app.use('/', routes.pageRoutes)
// app.use('/user', routes.userRoutes)
