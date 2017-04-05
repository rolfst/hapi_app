/**
 * @module modules/core/services/organisation
 */

const logger = require('../../../../shared/services/logger')('CORE/service/object');

const listNetworks = (payload, message) => {
  logger.debug('List all network for organisation', { payload, message });
};

exports.listNetworks = listNetworks;
