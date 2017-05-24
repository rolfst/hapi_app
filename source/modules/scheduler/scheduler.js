const CronJob = require('cron').CronJob;
const createSentryClient = require('../../shared/services/sentry');
const syncService = require('../integrations/services/sync');
const removeShifts = require('./remove-shifts');

const logger = require('../../shared/services/logger')('MODULE/scheduler');

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

const removeOutdatedShiftsJob = new CronJob({
  cronTime: '05 * * * *', // Every day at 0:05
  onTick() {
    try {
      logger.debug('Starting removal of outdated exchanges');
      removeShifts.run();
    } catch (err) {
      logger.error('Removal of exchange failed', err);
      // Don't rethrow so the process will not die
    }
  },
  timeZone: 'Europe/Amsterdam',
  runOnInit: true,
});

syncJob.start();
removeOutdatedShiftsJob.start();
