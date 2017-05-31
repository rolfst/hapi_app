const moment = require('moment');

module.exports = (brandingOptions) => {
  return [{
    date: moment().toISOString(),
    startTime: moment().hours(14).minutes(30).toISOString(),
    endTime: moment().hours(21).minutes(0).toISOString(),
    description: 'Ik heb een bruiloft van een goede vriendin.',
    creator: `medewerker-2@${brandingOptions.mailExtension}`,
  }, {
    date: moment().add(1, 'days').toISOString(),
    startTime: moment().add(1, 'days').hours(9).minutes(0).toISOString(),
    endTime: moment().add(1, 'days').hours(16).minutes(45).toISOString(),
    creator: `medewerker@${brandingOptions.mailExtension}`,
  }, {
    date: moment().add(1, 'days').toISOString(),
    startTime: moment().add(1, 'days').hours(16).minutes(30).toISOString(),
    endTime: moment().add(1, 'days').hours(19).minutes(45).toISOString(),
    creator: `medewerker@${brandingOptions.mailExtension}`,
  }];
};
