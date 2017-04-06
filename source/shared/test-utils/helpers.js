const R = require('ramda');
const Promise = require('bluebird');
const authenticate = require('./authenticate');
const blueprints = require('./blueprints');
const organisationService = require('../../modules/core/services/organisation');
const organisationRepository = require('../../modules/core/repositories/organisation');
const networkService = require('../../modules/core/services/network');
const integrationRepo = require('../../modules/core/repositories/integration');
const userRepo = require('../../modules/core/repositories/user');
const networkRepo = require('../../modules/core/repositories/network');
const teamRepo = require('../../modules/core/repositories/team');
const activityRepo = require('../../modules/core/repositories/activity');
const objectRepo = require('../../modules/core/repositories/object');
const pollRepo = require('../../modules/poll/repositories/poll');
const { postRequest } = require('./request');

/**
 * @module shared/test-utils/TestHelper
 */

const DEFAULT_INTEGRATION = { name: 'PMT', token: 'footoken' };
const DEFAULT_NETWORK_EXTERNALID = 'https://partner2.testpmt.nl/rest.php/jumbowolfskooi';

const randomString = (prefix = 'test-object') =>
  `${prefix}-${Math.floor(Math.random() * 1000)}`;

const hapiFile = (fileName) => ({
  filename: fileName,
  path: `${process.cwd()}/${fileName}`,
  headers: {
    'content-disposition': `form-data; name="attachments"; filename="${fileName}"`,
    'content-type': 'image/jpg',
  },
});

/**
 * creates an integration in the database
 * @param {object} [attributes=DEFAULT_INTEGRATION] - attributes to user for an integration
 * @param {string} attributes.name - name of the integration
 * @param {string} attributes.token - token to be used to access the integration
 * @method createIntegration
 * @return {external:Promise<Integration>} {@link module:modules/core~Integration}
 */
function createIntegration(attributes = DEFAULT_INTEGRATION) {
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
function addUserToNetwork(networkUserAttributes) {
  return networkService.addUserToNetwork(networkUserAttributes);
}

function addUserToOrganisation(userId, organisationId, roleType = 'EMPLOYEE') {
  return organisationRepository.addUser(userId, organisationId, roleType);
}

function createOrganisation(name = randomString()) {
  return organisationService.create({ name });
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
async function createNetwork({
  name = randomString(),
  userId,
  organisationId,
  externalId,
  integrationName,
  userExternalId,
  userToken,
}) {
  const networkAttributes = { organisationId, userId, externalId, integrationName, name };
  const network = await networkService.create(networkAttributes);

  await addUserToNetwork({
    userId,
    userToken,
    networkId: network.id,
    roleType: 'ADMIN',
    externalId: userExternalId,
  });

  return network;
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
async function createNetworkWithIntegration({
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
function findAllNetworks() {
  return networkRepo.findAll();
}

function addTeamToNetwork(networkId, name = randomString(), description = null) {
  return teamRepo.create({ networkId, name, description });
}

/**
 * @param {object} credentials
 * @param {string} creadentials.username
 * @param {string} creadentials.password
 * @method getLoginToken
 * returns all the tokes for the user during login
 */
async function getLoginToken({ username, password }) {
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
async function createUser(userAttributes = {}) {
  const username = `test-user-${Math.floor(Math.random() * 1000)}`;
  const attributes = R.merge({
    username,
    email: `${username}@example.com`,
    password: `pw#${Math.floor(Math.random() * 1000)}`,
  }, userAttributes);

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
async function createUserForNewNetwork(userAttributes, { name = randomString() }) {
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
function authenticateUser(userCredentials) {
  return authenticate(userCredentials, { deviceName: 'testDevice' });
}

/**
 * Deletes users from database
 * @param {User} user
 * @method deleteUser
 * @return {external:Promise.<number[]>}
 */
function deleteUser(user) {
  return userRepo.deleteById(user.id);
}

/**
 * Finds all users in the database
 * @method findAllUsers
 * @return {external:Promise<User[]>} {@link module:shared~User User}
 */
function findAllUsers() {
  return userRepo.findAllUsers();
}

/**
 * Deletes integrations from the database
 * @param {Integration} integration
 * @method deleteIntegration
 * @return {external:Promise}
 */
function deleteIntegration(integration) {
  return integrationRepo.deleteById(integration.id);
}

/**
 * Finds all integrations in the database
 * @method findAllIntegrations
 * @return {external:Promise.IntegrationsModel[]>}
 */
function findAllIntegrations() {
  return integrationRepo.findAll();
}

/**
 * Finds all Activites in the database
 * @method findAllActivities
 * @return {external:Promise.<Activity[]} {@link module:shared~Activity Activity}
 */
function findAllActivities() {
  return activityRepo.findAll();
}

/**
 * Deletes activities from database
 * @param {Activity} activity
 * @method deleteActivity
 * @return {external:Promise.<number[]>} number of deleted activities
 */
function deleteActivity(activity) {
  return activityRepo.deleteById(activity.id);
}

/**
 * Deletes objects from database
 * @param {Object} object
 * @method deleteObject
 * @return {external:Promise.<number[]>} number of deleted objects
 */
function deleteObject(object) {
  return objectRepo.deleteById(object.id);
}

/**
 * Finds all Objects in the database
 * @method findAllObjects
 * @return {external:Promise.<Object[]} {@link module:shared~Object Object}
 */
async function findAllObjects() {
  return objectRepo.findAll();
}

/**
 * Finds all Polls in the database
 * @method findAllPolls
 * @return {external:Promise.<Poll[]} {@link module:modules/poll~Poll Poll}
 */
async function findAllPolls() {
  return pollRepo.findAll();
}

/**
 * Deletes polls from database
 * @param {Poll} poll
 * @method deletePoll
 * @return {external:Promise.<number[]>} number of deleted polls
 */
async function deletePoll(poll) {
  return pollRepo.deleteById(poll.id);
}

/**
 * Deletes all data in the database
 * @method cleanAll
 */
async function cleanAll() {
  const networks = await findAllNetworks();
  const admins = R.map((network) => network.superAdmin, networks);
  await Promise.all(R.map(deleteUser, admins));

  const users = await findAllUsers();
  await Promise.all(R.map(deleteUser, users));

  const objects = await findAllObjects();
  await Promise.all(R.map(deleteObject, objects));

  const activities = await findAllActivities();
  await Promise.all(R.map(deleteActivity, activities));

  const integrations = await findAllIntegrations();
  await Promise.all(R.map(deleteIntegration, integrations));

  const polls = findAllPolls();
  await Promise.all(R.map(deletePoll, polls));
}

exports.DEFAULT_INTEGRATION = DEFAULT_INTEGRATION;
exports.DEFAULT_NETWORK_EXTERNALID = DEFAULT_NETWORK_EXTERNALID;
exports.addTeamToNetwork = addTeamToNetwork;
exports.addUserToNetwork = addUserToNetwork;
exports.addUserToOrganisation = addUserToOrganisation;
exports.authenticateUser = authenticateUser;
exports.cleanAll = cleanAll;
exports.createOrganisation = createOrganisation;
exports.createIntegration = createIntegration;
exports.createNetwork = createNetwork;
exports.createNetworkWithIntegration = createNetworkWithIntegration;
exports.createUser = createUser;
exports.createUserForNewNetwork = createUserForNewNetwork;
exports.deleteActivity = deleteActivity;
exports.deleteIntegration = deleteIntegration;
exports.deleteObject = deleteObject;
exports.deletePoll = deletePoll;
exports.deleteUser = deleteUser;
exports.findAllActivities = findAllActivities;
exports.findAllIntegrations = findAllIntegrations;
exports.findAllNetworks = findAllNetworks;
exports.findAllObjects = findAllObjects;
exports.findAllPolls = findAllPolls;
exports.findAllUsers = findAllUsers;
exports.getLoginToken = getLoginToken;
exports.hapiFile = hapiFile;
exports.randomString = randomString;
