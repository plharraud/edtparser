require('dotenv').config()
const express = require('express')
const core = require('./core')
const path = require('path')

const app = express()

app.get('/ics', core.parseEvents, core.sendics)
app.use(process.env.APP_BASE, express.static(path.resolve('src') + '/../dist'))
app.get('/json', core.parseEvents, core.json)
app.get('/debug', core.parseEvents, core.debug)

const port = process.env.PORT || 8080
app.listen(port)
console.log('Running at http://localhost:' + port + process.env.APP_BASE)
