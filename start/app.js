require('express-async-errors');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const errorHandler = require('../app/middlewares/errorHandler');

class App {
  constructor() {
    this.express = express();
    this.express.use(express.json());
    this.express.use(cors());
    this.express.use(routes);
    this.express.use(errorHandler);
  }
}

module.exports = new App().express;
