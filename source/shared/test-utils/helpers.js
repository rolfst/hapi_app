import { isArray } from 'lodash';
import Promise from 'bluebird';
import authenticate from './authenticate';
import * as networkService from '../../modules/core/services/network';
import * as integrationRepo from '../../modules/core/repositories/integration';
import * as userRepo from '../../modules/core/repositories/user';
import * as networkRepo from '../../modules/core/repositories/network';

/**
 * @module shared/test-utils/TestHelper
 */

export const DEFAULT_INTEGRATION = { name: 'PMT', token: 'footoken' };
export const DEFAULT_NETWORK_EXTERNALID = 'https://partner2.testpmt.nl/rest.php/jumbowolfskooi';

const DEFAULT_AUTHENTICATION_MESSAGE = { deviceName: 'testDevice' };

/**
 * creates an integration in the database
 * @param {object} [attributes=DEFAULT_INTEGRATION] - attributes to user for an integration
 * @param {string} attributes.name - name of the integration
 * @param {string} attributes.token - token to be used to access the integration
 * @method createIntegration
 * @return {Promise.<Integration>}
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
 * @return {Promise.<Network>} - created network
 */
export function createNetwork(networkAttributes) {
  return networkService.create(networkAttributes);
}


/**
 * finds all networks in the database
 * @method findAllNetworks
 * @return {Promise.NetworkModel[]}
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
 * @return {Promise.<User>}
 */
export async function createUser(userAttributes) {
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
 * @return {Promise.<NetworkUser>}
 */
export async function addUserToNetwork(networkUserAttributes) {
  return networkService.addUserToNetwork(networkUserAttributes);
}


/**
 * authenticates a user
 * @param {object} userCredentials
 * @param {string} userCredentials.username
 * @param {string} userCredentials.password
 * @param {string} userCredentials.deviceName
 * @param {object} [message]
 * @param {string} message.deviceName
 * @method authenticateUser
 * @return {Promise.AuthorizedUser} {@link module:shared/test-utils/authenticate.AuthorizedUser}
 */
export async function authenticateUser(userCredentials, message = DEFAULT_AUTHENTICATION_MESSAGE) {
  return authenticate(userCredentials, message);
}


/**
 * Deletes users from database
 * @param {UserModel|UserModel[]} userOrUsers
 * @param {string} userOrUsers.id
 * @method deleteUsers
 * @return {Promise}
 */
export async function deleteUsers(userOrUsers) {
  let users;

  if (!isArray(userOrUsers)) {
    users = [userOrUsers];
  } else {
    users = userOrUsers;
  }
  return Promise.map(users, (user) => userRepo.deleteById(user.id));
}

/**
 * finds all users in the database
 * @method findAllUsers
 * @return {Promise.UserModel[]}
 */
export async function findAllUsers() {
  return userRepo.findAllUsers();
}

/**
 * Deletes integrations from the database
 * @param {IntegrationModel|IntegrationModel[]} integrationOrIntegrations
 * @param {string} integrationOrIntegrations.id
 * @method deleteIntegrations
 * @return {Promise}
 */
export async function deleteIntegrations(integrationOrIntegrations) {
  let integrations;

  if (!isArray(integrationOrIntegrations)) {
    integrations = [integrationOrIntegrations];
  } else {
    integrations = integrationOrIntegrations;
  }
  return Promise.map(integrations, (integration) => integrationRepo.deleteById(integration.id));
}

/**
 * finds all integrations in the database
 * @method findAllIntegrations
 * @return {Promise.IntegrationsModel[]}
 */
export async function findAllIntegrations() {
  return integrationRepo.findAll();
}
