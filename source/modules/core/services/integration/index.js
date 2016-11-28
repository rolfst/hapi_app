import * as integrationRepo from '../../repositories/integration';

/**
 * list all integrations
 * @param {object} payload - not used
 * @param {object} message - contains request metadata
 * @method list
 * @return {Promise} list of all integrations
 */
export const list = async () => {
  return integrationRepo.findAll();
};
