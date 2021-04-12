const request = require("supertest");
const app = require("../../start/app");

const username = "marcellobc";
const repository = "ton-challenge";

describe("GET /:username/:repository", () => {
  it(`should returns the file count, the total number of lines
   and the total number of bytes grouped by file extension, 
   of a given public Github repository.`, async () => {
    const response = await request(app).get(`/${username}/${repository}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  }, 500000);

  it(`should return status 404.`, async () => {
    const response = await request(app).get(`/${username}/${repository}--fail`);
    expect(response.status).toBe(404);
  }, 500000);
});
