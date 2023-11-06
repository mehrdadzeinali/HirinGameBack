const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');
const app = express();

app.use(cors());
app.use(express.json());

// Include your routes
app.use('/', routes);

module.exports = app;
