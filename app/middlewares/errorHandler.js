const HttpException = require("../exceptions/HttpException");

function errorHandler(error, req, res, next) {
  return error instanceof HttpException
    ? res.status(error.statusCode).json(error)
    : res.status(500).json(new HttpException(500, error.message));
}

module.exports = errorHandler;
