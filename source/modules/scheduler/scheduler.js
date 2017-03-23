const CronJob = require('cron').CronJob;
const createSentryClient = require('../../shared/services/sentry').default;
const syncService = require('../integrations/services/sync');

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

const weeklyUpdateJob = new CronJob({
  cronTime: '00 13 * * 05', // Every friday at 13:00
  onTick() {
    // TODO
  },
  timeZone: 'Europe/Amsterdam',
});

syncJob.start();
weeklyUpdateJob.start();
