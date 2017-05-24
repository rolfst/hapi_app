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
  logger.debug('Removing objects for outdated exchanges');

  const passedExchanges = await exchangeRepo.findAllBy({ date: { $lt: moment().format('YYYY-MM-DD') } });
  const objects = await objectRepo.findBy({
    objectType: 'exchange',
    parentType: 'user',
    sourceId: { $in: R.pluck('id', passedExchanges) },
  });

  logger.info('Removing objects for outdated exchanges', { count: objects.length });

  return Promise.map(R.pluck('id', objects), objectRepo.deleteById);
};

exports.run = run;
