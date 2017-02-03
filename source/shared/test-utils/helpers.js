import { flatten } from 'lodash';
import R from 'ramda';
import Promise from 'bluebird';
import authenticate from './authenticate';
import blueprints from './blueprints';
import * as networkService from '../../modules/core/services/network';
import * as integrationRepo from '../../modules/core/repositories/integration';
import * as userRepo from '../../modules/core/repositories/user';
import * as networkRepo from '../../modules/core/repositories/network';
import * as activityRepo from '../../modules/core/repositories/activity';
import * as objectRepo from '../../modules/feed/repositories/object';
import * as pollRepo from '../../modules/poll/repositories/poll';
import { postRequest } from './request';

/**
 * @module shared/test-utils/TestHelper
 */

export const DEFAULT_INTEGRATION = { name: 'PMT', token: 'footoken' };
export const DEFAULT_NETWORK_EXTERNALID = 'https://partner2.testpmt.nl/rest.php/jumbowolfskooi';

export const randomString = (prefix = 'test-object') =>
  `${prefix}-${Math.floor(Math.random() * 1000)}`;

/**
 * creates an integration in the database
 * @param {object} [attributes=DEFAULT_INTEGRATION] - attributes to user for an integration
 * @param {string} attributes.name - name of the integration
 * @param {string} attributes.token - token to be used to access the integration
 * @method createIntegration
 * @return {external:Promise<Integration>} {@link module:modules/core~Integration}
 */
export function createIntegration(attributes = DEFAULT_INTEGRATION) {
  return integrationRepo.createIntegration(attributes);
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
export function addUserToNetwork(networkUserAttributes) {
  return networkService.addUserToNetwork(networkUserAttributes);
}

/**
 * Creates a network based on the attributes
 * @param {Object} networkAttributes
 * @param {string} networkAttributes.userId
 * @param {string} [networkAttributes.externalId]
 * @param {string} [networkAttributes.name]
 * @param {string} [networkAttributes.integrationName]
 * @param {string} [networkAttributes.userExternalId]
 * @param {string} [networkAttributes.userToken]
 * @method createNetwork
 * @return {external:Promise<Network>} {@link module:modules/core~Network Network} - created network
 */
export function createNetwork({
  userId, externalId, integrationName, name = randomString(), userExternalId, userToken }) {
  const networkAttributes = { userId, externalId, integrationName, name };

  return networkService.create(networkAttributes)
    .then(network => {
      addUserToNetwork({
        networkId: network.id, userId, roleType: 'ADMIN', externalId: userExternalId, userToken });

      return network;
    });
}

/**
 * Creates a network and an integration based on the attributes
 * @param {Object} networkAttributes
 * @param {string} networkAttributes.userId
 * @param {string} [networkAttributes.externalId]
 * @param {string} [networkAttributes.name]
 * @param {string} [networkAttributes.integrationName]
 * @param {string} [networkAttributes.integrationToken] - token to be used to access the integration
 * @param {string} [networkAttributes.userExternalId]
 * @param {string} [networkAttributes.userToken]
 * @method createNetworkWithIntegration
 * @return {external:Promise<Object>}
 */
export async function createNetworkWithIntegration({
  userId,
  externalId,
  name = randomString(),
  integrationName = randomString(),
  integrationToken = randomString(),
  userExternalId = null,
  userToken = null }) {
  const integration = await createIntegration({ name: integrationName, token: integrationToken });
  const network = await createNetwork(
      { userId, externalId, name, integrationName, userToken, userExternalId });

  return { integration, network };
}

/**
 * Finds all networks in the database
 * @method findAllNetworks
 * @return {external:Promise<Network[]>} {@link module:modules/core~Network Network}
 */
export function findAllNetworks() {
  return networkRepo.findAll();
}

/**
 * @param {object} credentials
 * @param {string} creadentials.username
 * @param {string} creadentials.password
 * @method getLoginToken
 * returns all the tokes for the user during login
 */
export async function getLoginToken({ username, password }) {
  const url = '/v2/authenticate';
  const { result } = await postRequest(url, { username, password });

  return { tokens: result.data };
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
  const attributes = { username: `test-user-${Math.floor(Math.random() * 1000)}`,
    password: `pw#${Math.floor(Math.random() * 1000)}`,
    ...userAttributes };
  const user = await userRepo.createUser(R.merge(blueprints.users.admin, attributes));
  const token = await getLoginToken(attributes);
  user.token = token.tokens.access_token;

  return user;
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
  userAttributes, { name = randomString() }) {
  const user = await createUser(userAttributes);
  const network = await createNetwork({ userId: user.id, name });
  await addUserToNetwork({ networkId: network.id, userId: user.id, roleType: 'ADMIN' });
  const domainUser = await userRepo.findUserById(user.id, network.id);

  return { user: domainUser, network };
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
export function authenticateUser(userCredentials) {
  return authenticate(userCredentials, { deviceName: 'testDevice' });
}

/**
 * Deletes users from database
 * @param {User|User[]} userOrUsers
 * @method deleteUser
 * @return {external:Promise.<number[]>}
 */
export function deleteUser(...userOrUsers) {
  return Promise.map(flatten(userOrUsers), (user) => userRepo.deleteById(user.id));
}

/**
 * Finds all users in the database
 * @method findAllUsers
 * @return {external:Promise<User[]>} {@link module:shared~User User}
 */
export function findAllUsers() {
  return userRepo.findAllUsers();
}

/**
 * Deletes integrations from the database
 * @param {Integration|Integration[]} integrationOrIntegrations
 * @method deleteIntegration
 * @return {external:Promise}
 */
export function deleteIntegration(...integrationOrIntegrations) {
  return Promise.map(flatten(integrationOrIntegrations),
    (integration) => integrationRepo.deleteById(integration.id));
}

/**
 * Finds all integrations in the database
 * @method findAllIntegrations
 * @return {external:Promise.IntegrationsModel[]>}
 */
export function findAllIntegrations() {
  return integrationRepo.findAll();
}

/**
 * Finds all Activites in the database
 * @method findAllActivities
 * @return {external:Promise.<Activity[]} {@link module:shared~Activity Activity}
 */
export function findAllActivities() {
  return activityRepo.findAll();
}

/**
 * Deletes activities from database
 * @param {Activity|Activity[]} activityOrActivities
 * @method deleteActivity
 * @return {external:Promise.<number[]>} number of deleted activities
 */
export function deleteActivity(...activityOrActivities) {
  return Promise.map(flatten(activityOrActivities), (activity) => 
    activityRepo.deleteById(activity.id));
}

/**
 * Deletes objects from database
 * @param {Object|Object[]} objectOrObjects
 * @method deleteObject
 * @return {external:Promise.<number[]>} number of deleted objects
 */
export function deleteObject(...objectOrObjects) {
  return Promise.map(flatten(objectOrObjects), (object) => objectRepo.deleteById(object.id));
}

/**
 * Finds all Objects in the database
 * @method findAllObjects
 * @return {external:Promise.<Object[]} {@link module:shared~Object Object}
 */
export async function findAllObjects() {
  return objectRepo.findAll();
}

/**
 * Finds all Polls in the database
 * @method findAllPolls
 * @return {external:Promise.<Poll[]} {@link module:modules/poll~Poll Poll}
 */
export async function findAllPolls() {
  return pollRepo.findAll();
}

/**
 * Deletes polls from database
 * @param {Poll|Poll[]} objectOrPolls
 * @method deletePoll
 * @return {external:Promise.<number[]>} number of deleted polls
 */
export async function deletePoll(...pollOrPolls) {
  return Promise.map(flatten(pollOrPolls), (poll) => pollRepo.deleteById(poll.id));
}

/**
 * Deletes all data in the database
 * @method cleanAll
 */
export function cleanAll() {
  return Promise.map(findAllNetworks(), (network) => networkRepo.deleteById(network.id))
  .then(() => Promise.map(findAllUsers(), deleteUser))
  .then(() => Promise.map(findAllActivities(), deleteActivity))
  .then(() => Promise.map(findAllIntegrations(), deleteIntegration))
  .then(() => Promise.map(findAllObjects(), deleteObject))
  .then(() => Promise.map(findAllPolls(), deletePoll));
}
