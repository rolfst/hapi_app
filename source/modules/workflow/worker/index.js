/* eslint no-use-before-define: ["error", { "functions": false }] */
const impl = require('./implementation');
const { WORKER_INTERVAL } = require('../definitions');

let timer;
let running = false;
let shuttingDown = false;

function scheduleNextRun() {
  if (shuttingDown) return;

  timer = setTimeout(run, WORKER_INTERVAL);
}

function run() {
  if (running || shuttingDown) return;

  if (!timer) {
    return scheduleNextRun();
  }

  running = true;

  impl
    .fetchAndProcessWorkflows()
    .finally(() => {
      running = false;

      // we're testing, so stop after one run
      if (process.env.API_ENV === 'testing') return;

      scheduleNextRun();
    });
}

function shutdown() {
  shuttingDown = true;
}

exports = run;
exports.start = run;
exports.shutdown = shutdown;

module.exports = exports;
