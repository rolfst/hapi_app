const integrationRepo = require('../../repositories/integration');

/**
 * @module modules/core/services/integration
 */

/**
 * list all integrations
 * @param {object} payload - not used
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method list
 * @return {external:Promise.<Integration[]>} {@link module:modules/core~Integration Integration} -
 * list of all integrations
 */
export const list = async () => {
  return integrationRepo.findAll();
};
