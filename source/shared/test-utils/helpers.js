import { flatten } from 'lodash';
import R from 'ramda';
import Promise from 'bluebird';
import authenticate from './authenticate';
import generateNetworkName from './create-network-name';
import blueprints from './blueprints';
import * as networkService from '../../modules/core/services/network';
import * as integrationRepo from '../../modules/core/repositories/integration';
import * as userRepo from '../../modules/core/repositories/user';
import * as networkRepo from '../../modules/core/repositories/network';
import * as activityRepo from '../../modules/core/repositories/activity';
import { postRequest } from './request';
import tokenUtil from '../utils/token';

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
 * @return {external:Promise<Integration>} {@link module:modules/core~Integration}
 */
export async function createIntegration(attributes = DEFAULT_INTEGRATION) {
  return integrationRepo.createIntegration(attributes);
}

/**
 * Creates a network based on the attributes
 * @param {Object} networkAttributes
 * @param {string} networkAttributes.userId
 * @param {string} [networkAttributes.externalId]
 * @param {string} [networkAttributes.name]
 * @param {string} [networkAttributes.integrationName]
 * @method createNetwork
 * @return {external:Promise<Network>} {@link module:modules/core~Network Network} - created network
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
 * @return {external:Promise<Network[]>} {@link module:modules/core~Network Network}
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
 * @return {external:Promise<Network[]>} {@link module:modules/core~Network Network}
 */
export async function findAllNetworks() {
  return networkRepo.findAll();
}

/**
 * Creates a user in the database
 * @param {object} userAttributes
 * @param {string} [userAttributes.username]
 * @param {string} [userAttributes.firstName]
 * @param {string} [userAttributes.lastName]
 * @param {string} [userAttributes.email]
 * @param {string} [userAttributes.password]
 * @method createUser
 * @return {external:Promise<User>} {@link module:modules/core~User User}
 */
export async function createUser(userAttributes = {}) {
  return userRepo.createUser(R.merge(blueprints.users.admin, userAttributes));
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
 * @return {external:Promise.<NetworkUser>} {@link module:shared~NetworkUser NetworkUser}
 */
export async function addUserToNetwork(networkUserAttributes) {
  return networkService.addUserToNetwork(networkUserAttributes);
}

/**
 * Creates a user and a network in the database, the user is assigned as owner
 * @param {object} userAttributes
 * @param {string} userAttributes.username
 * @param {string} userAttributes.firstName
 * @param {string} userAttributes.lastName
 * @param {string} userAttributes.email
 * @param {string} userAttributes.password
 * @param {Object} networkAttributes
 * @param {string} networkAttributes.name
 * @method createUserForNewNetwork
 * @return {external:Promise.<object>} {@link module:shared~User user},
 * {@link module:shared~Network network}
 */
export async function createUserForNewNetwork(
  userAttributes, { name = generateNetworkName() }) {
  const user = await createUser(userAttributes);
  const network = await createNetwork({ userId: user.id, name });
  await addUserToNetwork({ networkId: network.id, userId: user.id, roleType: 'ADMIN' });
  const domainUser = await userRepo.findUserById(user.id, network.id);

  return { user: domainUser, network };
}

/**
 * Creates a user and a network in the database, the user is assigned as owner
 * @param {object} userAttributes
 * @param {string} userAttributes.username
 * @param {string} userAttributes.firstName
 * @param {string} userAttributes.lastName
 * @param {string} userAttributes.email
 * @param {string} userAttributes.password
 * @param {Object} networkAttributes
 * @param {string} networkAttributes.name
 * @param {Object} integrationAttributes
 * @param {string} integrationAttributes.integrationName
 * @param {string} integrationAttributes.token
 * @param {string} [roleType='EMPOYEE']
 * @method createUserForNewNetworkWithIntegration
 * @return {external:Promise.<object>} {@link module:shared~User user},
 * {@link module:shared~Network network}
 */
export async function createUserForNewNetworkWithIntegration(
  userAttributes,
  { name = generateNetworkName() },
  { token, integrationName, externalId }, roleType = 'EMPLOYEE') {
  const user = await createUser(userAttributes);
  const integration = await createIntegration({ name: integrationName, token });
  const network = await createNetwork({ userId: user.id, name, externalId, integrationName });

  await addUserToNetwork({
    networkId: network.id,
    userId: user.id,
    externalId: userAttributes.externalId,
    roleType,
    userToken: token,
    integrationName });
  const domainUser = await userRepo.findUserById(user.id, network.id);

  return { user: domainUser, network, integration };
}

/**
 * Authenticates a user
 * @param {object} userCredentials
 * @param {string} userCredentials.username
 * @param {string} userCredentials.password
 * @method authenticateUser
 * @return {external:Promise<AuthorizedUser>}
 * @link module:shared/test-utils/authenticate.AuthorizedUser}
 */
export async function authenticateUser(userCredentials) {
  return authenticate(userCredentials, { deviceName: 'testDevice' });
}

/**
 * Deletes users from database
 * @param {User|User[]} userOrUsers
 * @method deleteUser
 * @return {external:Promise.<number[]>}
 */
export async function deleteUser(...userOrUsers) {
  return Promise.map(flatten(userOrUsers), (user) => userRepo.deleteById(user.id));
}

/**
 * Finds all users in the database
 * @method findAllUsers
 * @return {external:Promise<User[]>} {@link module:shared~User User}
 */
export async function findAllUsers() {
  return userRepo.findAllUsers();
}

/**
 * Deletes integrations from the database
 * @param {Integration|Integration[]} integrationOrIntegrations
 * @method deleteIntegration
 * @return {external:Promise}
 */
export async function deleteIntegration(...integrationOrIntegrations) {
  return Promise.map(flatten(integrationOrIntegrations),
    (integration) => integrationRepo.deleteById(integration.id));
}

/**
 * Finds all integrations in the database
 * @method findAllIntegrations
 * @return {external:Promise.IntegrationsModel[]>}
 */
export async function findAllIntegrations() {
  return integrationRepo.findAll();
}

/**
 * Finds all Activites in the database
 * @method findAllActivities
 * @return {external:Promise.<Activity[]} {@link module:shared~Activity Activity}
 */
export async function findAllActivities() {
  return activityRepo.findAll();
}

/**
 * Deletes activities from database
 * @param {Activity|Activity[]} activityOrActivities
 * @method deleteActivity
 * @return {external:Promise.<number[]>} number of deleted activities
 */
export async function deleteActivity(...activityOrActivities) {
  return Promise.map(flatten(activityOrActivities), (activity) => {
    activityRepo.deleteById(activity.id);
  });
}

/**
 * Deletes all data in the database
 * @method cleanAll
 */
export async function cleanAll() {
  const allUsers = await findAllUsers();
  const allIntegrations = await findAllIntegrations();
  const allActivities = await findAllActivities();
  await Promise.all([
    deleteIntegration(allIntegrations),
    deleteActivity(allActivities),
  ]);
  return deleteUser(allUsers);
}

/**
 *
 */
export async function getLoginToken({ username, password }) {
  const url = '/v2/authenticate';
  const { result } = await postRequest(url, { username, password });

  return { accessToken: tokenUtil.decode(result.data.access_token), tokens: result.data };
}
