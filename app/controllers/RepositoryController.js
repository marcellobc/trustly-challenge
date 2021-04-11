const GithubScrapper = require("../utils/GithubScraper");

class RepositoryController {
  static async show(req, res) {
    const { username, repository } = req.params;
    const scraper = await new GithubScrapper().init();
    const result = await scraper.execute(username, repository);
    return res.send(result);
  }
}

module.exports = RepositoryController;
