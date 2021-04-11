const puppeteer = require("puppeteer");
const GITHUB_URL = "https://github.com";
const byteConverter = require("../helpers/byteConverter");

class GithubScrapper {
  constructor() {
    this.result = {};
  }

  async init() {
    this.browser = await puppeteer.launch();
    return this;
  }

  async close() {
    await this.browser.close();
  }

  async execute(username, repository, branch = "master") {
    this.username = username;
    this.repository = repository;
    this.url = GITHUB_URL + `/${username}/${repository}`;
    this.branch = branch;

    await this.inspectFolder("");
    return this.parseResult();
  }

  async inspectFile(filePath) {
    const url = `${this.url}/blob/${this.branch}${filePath}`;
    const page = await this.browser.newPage();
    await page.goto(url);

    const data = await page.evaluate(() => {
      const info = document
        .querySelectorAll(".text-mono")[3]
        .innerText.split(" ");

      const lines = +info[0] ?? 0;
      const size = info[info.length - 2] ?? 0;
      const sizeUnit = info[info.length - 1];

      return { lines, size, sizeUnit };
    });
    page.close();

    const extension = filePath.substring(
      filePath.lastIndexOf(".") + 1,
      filePath.length
    );

    this.addResult({ ...data, extension });
  }

  async inspectFolder(folderPath) {
    const url = `${this.url}/tree/${this.branch}${folderPath}`;
    const page = await this.browser.newPage();
    await page.goto(url);

    const { folders, files } = await page.evaluate(async () => {
      function getTextByAria(document, ariaName) {
        const svgs = document.querySelectorAll(`[aria-label="${ariaName}"]`);
        const svgArray = Object.keys(svgs).map((k) => svgs[k]);

        const folders = svgArray.map(
          (item) => item.parentElement.parentElement.children[1].innerText
        );

        return folders;
      }

      const folders = getTextByAria(document, "Directory");
      const files = getTextByAria(document, "File");

      return { folders, files };
    });

    page.close();

    await Promise.all(
      files.map((file) => this.inspectFile(`${folderPath}/${file}`))
    );

    await Promise.all(
      folders.map((folder) => this.inspectFolder(`${folderPath}/${folder}`))
    );

    // this.result = { ...this.result, folders };
  }

  addResult({ extension, lines, size, sizeUnit }) {
    console.log({ extension, lines, size, sizeUnit });
    const bytes = byteConverter(size, sizeUnit);
    if (this.result[extension]) {
      this.result[extension].lines += lines;
      this.result[extension].bytes += bytes;
      this.result[extension].count += 1;
    } else {
      this.result[extension] = { lines, bytes, count: 1 };
    }
  }

  parseResult() {
    const extensions = Object.keys(this.result);
    return extensions.map((extension) => {
      return { extension, ...this.result[extension] };
    });
  }
}

module.exports = GithubScrapper;
