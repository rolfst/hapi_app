import { flatten } from 'lodash';
import Promise from 'bluebird';
import authenticate from './authenticate';
import generateNetworkName from './create-network-name';
import blueprints from './blueprints';
import * as networkService from '../../modules/core/services/network';
import * as integrationRepo from '../../modules/core/repositories/integration';
import * as userRepo from '../../modules/core/repositories/user';
import * as networkRepo from '../../modules/core/repositories/network';

/**
 * @module shared/test-utils/TestHelper
 */

export const DEFAULT_INTEGRATION = { name: 'PMT', token: 'footoken' };
export const DEFAULT_NETWORK_EXTERNALID = 'https://partner2.testpmt.nl/rest.php/jumbowolfskooi';

function mandatory(paramName) {
  throw new Error(`Missing Parameter: ${paramName}`);
}

/**
 * creates an integration in the database
 * @param {object} [attributes=DEFAULT_INTEGRATION] - attributes to user for an integration
 * @param {string} attributes.name - name of the integration
 * @param {string} attributes.token - token to be used to access the integration
 * @method createIntegration
 * @return {Promise<Integration>}
 */
export async function createIntegration(attributes = DEFAULT_INTEGRATION) {
  return integrationRepo.createIntegration(attributes);
}

/**
 * Creates a network based on the attributes
 * @param {Object} networkAttributes
 * @param {string} networkAttributes.userId
 * @param {string} [networkAttributes.externalId]
 * @param {string} networkAttributes.name
 * @param {string} [networkAttributes.integrationName]
 * @method createNetwork
 * @return {Promise<Network>} - created network
 */
export async function createNetwork({
  userId, externalId, integrationName, name = generateNetworkName() }) {
  const networkAttributes = { userId, externalId, integrationName, name };
  return networkService.create(networkAttributes);
}

/**
 * Creates a network and an integration based on the attributes
 * @param {Object} networkAttributes
 * @param {string} networkAttributes.userId
 * @param {string} [networkAttributes.externalId]
 * @param {string} networkAttributes.name
 * @param {string} [networkAttributes.integrationName]
 * @param {string} attributes.token - token to be used to access the integration
 * @method createNetwork
 * @return {Promise<Network>} - created network
 */
export async function createNetworkWithIntegration({
  userId, externalId, name, integrationName, token }) {
  if (!integrationName) mandatory('integrationName');
  if (!token) mandatory('token');

  const integration = await createIntegration({ name: integrationName, token });
  const network = await createNetwork({ userId, externalId, name, integrationName });

  return { integration, network };
}

/**
 * Finds all networks in the database
 * @method findAllNetworks
 * @return {Promise<NetworkModel[]>}
 */
export async function findAllNetworks() {
  return networkRepo.findAll();
}

/**
 * Creates a user in the database
 * @param {object} userAttributes
 * @param {string} userAttributes.username
 * @param {string} userAttributes.firstName
 * @param {string} userAttributes.lastName
 * @param {string} userAttributes.email
 * @param {string} userAttributes.password
 * @method createUser
 * @return {Promise<UserModel>}
 */
export async function createUser(userAttributes = blueprints.users.admin) {
  return userRepo.createUser(userAttributes);
}

/**
 * Creates a networkuser in the database
 * @param {object} networkUserAttributes
 * @param {string} networkUserAttributes.networkId
 * @param {string} networkUserAttributes.userId
 * @param {UserRoles} networkUserAttributes.roleType
 * @param {string} networkUserAttributes.externalId
 * @param {string} networkUserAttributes.userToken
 * @method addUserToNetwork
 * @return {Promise<NetworkUserModel>}
 */
export async function addUserToNetwork(networkUserAttributes) {
  return networkService.addUserToNetwork(networkUserAttributes);
}


/**
 * Authenticates a user
 * @param {object} userCredentials
 * @param {string} userCredentials.username
 * @param {string} userCredentials.password
 * @method authenticateUser
 * @return {Promise<AuthorizedUser>} {@link module:shared/test-utils/authenticate.AuthorizedUser}
 */
export async function authenticateUser(userCredentials) {
  return authenticate(userCredentials, { deviceName: 'testDevice' });
}


/**
 * Deletes users from database
 * @param {User|User[]} userOrUsers
 * @method deleteUser
 * @return {Promise}
 */
export async function deleteUser(...userOrUsers) {
  return Promise.map(flatten(userOrUsers), (user) => userRepo.deleteById(user.id));
}

/**
 * Finds all users in the database
 * @method findAllUsers
 * @return {Promise<UserModel[]>}
 */
export async function findAllUsers() {
  return userRepo.findAllUsers();
}

/**
 * Deletes integrations from the database
 * @param {Integration|Integration[]} integrationOrIntegrations
 * @method deleteIntegration
 * @return {Promise}
 */
export async function deleteIntegration(...integrationOrIntegrations) {
  return Promise.map(flatten(integrationOrIntegrations),
    (integration) => integrationRepo.deleteById(integration.id));
}

/**
 * Finds all integrations in the database
 * @method findAllIntegrations
 * @return {Promise.IntegrationsModel[]>}
 */
export async function findAllIntegrations() {
  return integrationRepo.findAll();
}
