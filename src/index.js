require('dotenv').config()
const express = require('express')
const core = require('./core')
const path = require('path')

const app = express()

app.get('/ics', core.parseEvents, core.ics)
app.get('/json', core.parseEvents, core.parseCourses, core.json)
app.get('/debug', core.parseEvents, core.debug)
app.use('/', express.static(path.resolve('src') + '/../dist'))

const port = process.env.PORT || 8080
app.listen(port)
console.log('Running at http://localhost:' + port)
