// app.js
const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');
const authRoutes = require('./routes/authRoutes');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/', routes);

app.use('/api/auth', authRoutes);

module.exports = app;
