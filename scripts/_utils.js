#!/usr/bin/env node
'use strict'

const { exit } = require('process')

function die(msg, code = 1) {
  console.error(`✖ ${msg}`)
  exit(code)
}

function tryMain(main) {
  Promise.resolve()
    .then(() => main())
    .then(() => {
      // noop
    })
    .catch((err) => {
      console.error('Unhandled error:', err && err.stack ? err.stack : err)
      exit(1)
    })
}

function requireEnv(names) {
  const missing = names.filter((n) => !process.env[n] || process.env[n] === '')
  if (missing.length) die(`Missing required env vars: ${missing.join(', ')}`)
}

process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection:', err && err.stack ? err.stack : err)
})
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err && err.stack ? err.stack : err)
})

module.exports = { die, tryMain, requireEnv }
