const axios = require("axios");

const api = axios.create({
  baseURL: "https://github.com",
});

module.exports = api;
