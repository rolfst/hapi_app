const R = require('ramda');
const moment = require('moment');
require('moment/locale/nl');
require('moment-timezone').locale('nl');
const Promise = require('bluebird');
const Logger = require('../../../shared/services/logger');
const exchangeRepo = require('../../flexchange/repositories/exchange');
const objectRepo = require('../../core/repositories/object');

moment.locale('nl');

const logger = Logger.createLogger('SCRIPT/removeOutdatedExchanges');

/**
 * Remove all objects containing an outdated exchange
 * @method run
 * @return {external:Promise} - Send email promise
 */
const run = async () => {
  logger.info('Removing all shifts that are out of date');

  const passedExchanges = await exchangeRepo.findAllBy({ date: { $lt: moment().format('YYYY-MM-DD') } });
  const ids = R.pluck('id', passedExchanges);
  const objects = await objectRepo.findBy({ objectType: 'exchange', sourceId: { $in: ids } });

  return Promise.map(R.pluck('id', objects), objectRepo.deleteById);
};

exports.run = run;
