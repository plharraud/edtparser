require('dotenv').config()
const express = require('express')
const { middleware } = require('./core')

const app = express()

app.get('/', middleware)

app.listen(process.env.PORT)