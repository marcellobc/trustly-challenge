const puppeteer = require("puppeteer");

const GITHUB_URL = "https://github.com";
const byteConverter = require("../helpers/byteConverter");
const ExceptionHelper = require("../helpers/ExceptionHelper");

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

  async checkIfExists() {
    const page = await this.browser.newPage();
    await page.goto(this.url);

    const exists = await page.evaluate(async () => {
      const title = document.querySelector("title");

      return title.innerText.toUpperCase().indexOf("NOT FOUND") < 0;
    });

    page.close();

    if (!exists) ExceptionHelper.notFound();
  }

  async execute(username, repository, branch = "master") {
    this.username = username;
    this.repository = repository;
    this.url = `${GITHUB_URL}/${username}/${repository}`;
    this.branch = branch;

    await this.checkIfExists();
    await this.inspectFolder();
    return this.parseResult();
  }

  async inspectFile(filePath) {
    const url = `${this.url}/blob/${this.branch}${filePath}`;
    const page = await this.browser.newPage();
    await page.goto(url);

    const data = await page.evaluate(async () => {
      // I couldn't find a better selector. There are not specific classes or #ids
      // The most unique class is the 'file-info-divider', but pictures does not have this
      // cause they do not have lines and github put file specific description
      // (like "Execution Script") at left. this makes me change the reading from right  to left

      // And, in case fileDivider does not exist, use the delete file svg icon ('octicon-trash')
      // as selector. I know, it's extremely weird, but, again, I could not find an specific class
      // or id, sorry.

      // I hate comments, but I felt I need this.

      const fileDivider = document.querySelector(".file-info-divider");

      const info = fileDivider
        ? fileDivider.parentElement
        : document.querySelector(".octicon-trash").parentElement.parentElement
            .parentElement.parentElement.parentElement.firstElementChild;

      const infoArray = info.innerText.split(" ");

      const size = infoArray[infoArray.length - 2] ?? 0;
      const sizeUnit = infoArray[infoArray.length - 1];
      const lines = infoArray.length > 2 ? +infoArray[infoArray.length - 7] : 0;

      return { lines, size, sizeUnit };
    });

    page.close();

    const lastDot = filePath.lastIndexOf(".");

    this.addResult({
      ...data,
      extension:
        lastDot < 0 ? null : filePath.substring(lastDot + 1, filePath.length),
    });
  }

  async inspectFolder(folderPath = "") {
    const url = `${this.url}/tree/${this.branch}${folderPath}`;
    const page = await this.browser.newPage();
    await page.goto(url);

    const { folders, files } = await page.evaluate(async () => {
      function getTextByAria(document, ariaName) {
        const svgs = document.querySelectorAll(`[aria-label="${ariaName}"]`);
        const svgArray = Object.keys(svgs).map((k) => svgs[k]);

        const items = svgArray.map(
          (item) => item.parentElement.parentElement.children[1].innerText
        );

        return items;
      }

      return {
        folders: getTextByAria(document, "Directory"),
        files: getTextByAria(document, "File"),
      };
    });

    page.close();

    await Promise.all(
      files.map((file) => this.inspectFile(`${folderPath}/${file}`))
    );

    await Promise.all(
      folders.map((folder) => this.inspectFolder(`${folderPath}/${folder}`))
    );
  }

  addResult({ extension, lines, size, sizeUnit }) {
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
    return extensions.map((extension) => ({
      extension,
      ...this.result[extension],
    }));
  }
}

module.exports = GithubScrapper;
