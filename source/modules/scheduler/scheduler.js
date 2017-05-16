const CronJob = require('cron').CronJob;
// const R = require('ramda');
const createSentryClient = require('../../shared/services/sentry');
// const networkRepo = require('../core/repositories/network');
const syncService = require('../integrations/services/sync');
// const weeklyUpdate = require('./weekly-update');

// const logger = require('../../shared/services/logger')('MODULE/scheduler');

const syncJob = new CronJob({
  cronTime: '00 30 * * * *', // Every 30 minutes
  onTick() {
    const that = this;

    return syncService.syncWithIntegrationPartner()
      .catch((error) => {
        const sentryClient = createSentryClient();
        if (sentryClient && typeof sentryClient.captureException === 'function') {
          sentryClient.captureException(error);
        }

        that.stop();
      });
  },
  runOnInit: true,
  timeZone: 'Europe/Amsterdam',
});

// const weeklyUpdateJob = new CronJob({
//   cronTime: '00 13 * * 0', // Every sunday at 13:00
//   onTick() {
//     networkRepo.findAll()
//       .then(R.pipe(R.pluck('id'), R.map(weeklyUpdate.send)))
//       .catch((err) => {
//         logger.error('Weekly update failed', err);
//         // Don't rethrow so the process will not die
//       });
//   },
//   timeZone: 'Europe/Amsterdam',
// });

syncJob.start();
// weeklyUpdateJob.start();
