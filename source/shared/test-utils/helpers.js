import Promise from 'bluebird';
import * as networkService from '../../modules/core/services/network';
import * as integrationRepo from '../../modules/core/repositories/integration';

export const DEFAULT_INTEGRATION = { name: 'PMT', token: 'footoken' };

/**
 * creates an integration in the database
 * @param {object} [attributes=DEFAULT_INTEGRATION] - attributes to user for an integration
 * @param {string} attributes.name - name of the integration
 * @param {string} attributes.token - token to be used to access the integration
 * @method createIntegration
 * @return IntegrationModel
 */
export const createIntegration = async (attributes = DEFAULT_INTEGRATION) => {
  return integrationRepo.createIntegration(attributes);
};

/**
 * Creates a list of networks based on the attributes
 * @param {Object} networkAttributes
 * @method createNetworks
 * @return {Network} - created network
 */
export const createNetwork = async (networkAttributes) => {
  return networkService.create(networkAttributes);
};
