/* eslint no-use-before-define: ["error", { "functions": false }] */
const impl = require('./implementation');
const { WORKER_INTERVAL } = require('../definitions');
const logger = require('../../../shared/services/logger')('WORKFLOW/worker');

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
    logger.info('Started workflow worker');
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
  logger.info('Stopping workflow worker');
  shuttingDown = true;
}

function exitHandler(signal) {
  logger.info(`Workflow worker received shutdown signal (${signal})`);
  shutdown();
}

process.on('beforeExit', exitHandler.bind(null, 'beforeExit'));
process.on('exit', exitHandler.bind(null, 'exit'));
process.on('SIGINT', exitHandler.bind(null, 'SIGINT'));
process.on('uncaughtException', exitHandler.bind(null, 'uncaughtException'));

exports = run;
exports.start = run;
exports.shutdown = shutdown;

module.exports = exports;
