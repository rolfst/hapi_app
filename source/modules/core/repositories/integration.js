const R = require('ramda');
const { Integration } = require('./dao');

/**
 * @module modules/core/repositories/integration
 */

/**
 * creates a new integrations
 * @param {{name: string, token: string}} integration params
 * @method createIntegration
 * @return {external:Promise.<Integration>} {@link module:modules/core~Integration Integration}
 * - Promise with integration
 */
function createIntegration({ name, token }) {
  return Integration.create({ name, token });
}

/**
 * Deletes an integration
 * @param {string} integrationId
 * @method deleteById
 */
const deleteById = async (integrationId) => {
  return Integration.destroy({ where: { id: integrationId } });
};

/**
 * Finds all integrations
 * @method findAll
 * @return {external:Promise.<Integration[]>} {@link module:modules/core~Integration Integration}
 * - Promise with all integrations
 */
const findAll = async () => {
  return Integration.findAll();
};

const deleteAll = () => Integration.findAll()
  .then((integrations) => Integration.destroy({
    where: { id: { $in: R.pluck('id', integrations) } },
  }));

exports.createIntegration = createIntegration;
exports.deleteById = deleteById;
exports.findAll = findAll;
exports.deleteAll = deleteAll;
