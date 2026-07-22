const { SearchWorker } = require("./search.worker");
const { ScraperWorker } = require("./scraper.worker");
const { WorkerError } = require("./errors");

module.exports = {
  SearchWorker,
  ScraperWorker,
  WorkerError,
};
