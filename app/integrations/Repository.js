const api = require("./api");

class Repository {
  static async show(username, repository, branch = "master") {
    return api.get(`/${username}/${repository}/tree/${branch}`);
  }
}

module.exports = Repository;
