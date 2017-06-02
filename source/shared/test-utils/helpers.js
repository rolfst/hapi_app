const R = require('ramda');
const Promise = require('bluebird');
const uuid = require('uuid-v4');
const authenticate = require('./authenticate');
const blueprints = require('./blueprints');
const organisationService = require('../../modules/core/services/organisation');
const organisationRepository = require('../../modules/core/repositories/organisation');
const workflowRepository = require('../../modules/workflow/repositories/workflow');
const networkService = require('../../modules/core/services/network');
const exchangeRepo = require('../../modules/flexchange/repositories/exchange');
const integrationRepo = require('../../modules/core/repositories/integration');
const userRepo = require('../../modules/core/repositories/user');
const networkRepo = require('../../modules/core/repositories/network');
const teamRepo = require('../../modules/core/repositories/team');
const activityRepo = require('../../modules/core/repositories/activity');
const objectRepo = require('../../modules/core/repositories/object');
const objectSeenRepo = require('../../modules/core/repositories/object-seen');
const commentsRepo = require('../../modules/feed/repositories/comment');
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

/**
 * Create an organisation
 * @param {string} name - The name of the origanisation
 * @returns {*|external:Promise.<Organisation>}
 */
function createOrganisation(name = randomString()) {
  return organisationService.create({ name });
}

/**
 * @param userId - The id of the user to add
 * @param organisationId - The id of the organisation
 * @param roleType - ADMIN or EMPLOYEE for security
 * @param functionId - Organisational function of the user
 * @method addUserToOrganisation
 * @returns {Promise.<OrganisationUser>}
 */
function addUserToOrganisation(userId, organisationId, roleType = 'EMPLOYEE', functionId = null) {
  return organisationRepository.addUser(userId, organisationId, roleType, functionId);
}

/**
 * Creates a function in an origanisation
 * @param {number} organisationId
 * @param {string} name
 * @returns {external:Promise<Organisation>} - created network
 */
const createOrganisationFunction = (organisationId, name = randomString()) => {
  return organisationRepository.addFunction(organisationId, name);
};

/**
 * Creates a network based on the attributes
 * @param {Object} networkAttributes
 * @param {string} networkAttributes.userId
 * @param {string} [networkAttributes.externalId]
 * @param {string} [networkAttributes.organisationId]
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

function createTeamInNetwork(networkId, name = randomString(), description = null) {
  return teamRepo.create({ networkId, name, description });
}

/**
 * Adds a User to a team
 * @param {string} teamId
 * @param {string} userId
 * @method addUserToTeam
 * @return {external:Promise.<TeamUser>} {@link module:modules/core~TeamUser TeamUser}
 */
function addUserToTeam(teamId, userId) {
  return teamRepo.addUserToTeam(teamId, userId);
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
  const username = `test-user-${uuid()}`;
  const attributes = R.merge({
    username,
    email: `${username}@example.com`,
    password: `pw#${Math.floor(Math.random() * 100000)}`,
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
 * Deletes activities from database
 * @param {Activity} activity
 * @method deleteActivity
 * @return {external:Promise.<number[]>} number of deleted activities
 */
function deleteActivity(activity) {
  return activityRepo.deleteById(activity.id);
}
/**
 * Finds all Exchanges
 * @method findAllExchanges
 * @returns {external:Promise.<Exchange[]>} {@link module:modules/flexchange~Exchange Exchange}
 */
function findAllExchanges() {
  return exchangeRepo.findAllBy();
}

/**
 * Deletes exchanges from database
 * @param {Exchange} exchange
 * @method deleteExchange
 * @returns {external:Promise.<number[]>} number of deleted exchanges
 */
function deleteExchange(exchange) {
  return exchangeRepo.deleteById(exchange.id);
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
 * Deletes polls from database
 * @param {Poll} poll
 * @method deletePoll
 * @return {external:Promise.<number[]>} number of deleted polls
 */
async function deletePoll(poll) {
  return pollRepo.deleteById(poll.id);
}

async function deleteComment() {
  return commentsRepo.deleteAll();
}

/**
 * Creates a complete workflow object with some dummy triggers, conditions and actions
 * @param {number} organisationId
 * @param {string} Optional: name
 * @method createCompleteWorkFlow
 * @return {external:Array<WorkFlow, Triggers, Conditions, Action>}
 */
async function createCompleteWorkFlow(organisationId, name = randomString()) {
  const createdWorkFlow = await workflowRepository
    .create({ organisationId, name });

  const [createdTriggers, createdConditions, createdActions] = await Promise.all([
    Promise.all([
      workflowRepository.createTrigger({
        workflowId: createdWorkFlow.id,
        type: workflowRepository.ETriggerTypes.DATETIME,
        value: '2017-01-01',
      }),
    ]),
    Promise.all([
      workflowRepository.createCondition({
        workflowId: createdWorkFlow.id,
        field: 'user.age',
        operator: workflowRepository.EConditionOperators.GREATER_THAN_OR_EQUAL,
        value: '18',
      }),
    ]),
    Promise.all([
      workflowRepository.createAction({
        workflowId: createdWorkFlow.id,
        type: workflowRepository.EActionTypes.MESSAGE,
        meta: {
          senderId: 1,
          content: 'Too old for stocking',
        },
      }),
    ]),
  ]);

  return R.merge(createdWorkFlow, {
    triggers: createdTriggers,
    conditions: createdConditions,
    actions: createdActions,
  });
}

/**
 * Creates a workflow object
 * @param {number} organisationId
 * @param {string} Optional: name
 * @method createWorkFlow
 * @return {external:Array<WorkFlow, Triggers, Conditions, Action>}
 */
async function createWorkFlow(organisationId, name = randomString()) {
  return workflowRepository
    .create({ organisationId, name });
}

/**
 * Creates a workflow trigger
 * @param {number} workflowId
 * @param {string} Optional: type (ETriggerTypes)
 * @param {date|string} Optional: value
 * @method createTrigger
 * @return {external:Array<WorkFlow, Triggers, Conditions, Action>}
 */
async function createTrigger(
  workflowId,
  type = workflowRepository.ETriggerTypes.DATETIME,
  value = randomString()
) {
  return workflowRepository
    .createTrigger({ workflowId, type, value });
}

/**
 * Creates a workflow condition
 * @param {number} workflowId
 * @param {string} Optional: field
 * @param {string} Optional: operator (EConditionOperators)
 * @param {string} Optional: value
 * @method createCondition
 * @return {external:Array<WorkFlow, Triggers, Conditions, Action>}
 */
async function createCondition(
  workflowId,
  field = randomString(),
  operator = workflowRepository.EConditionOperators.EQUAL,
  value = randomString()
) {
  return workflowRepository
    .createCondition({ workflowId, field, operator, value });
}

/**
 * Creates a workflow action
 * @param {number} workflowId
 * @param {string} Optional: type (EActionTypes)
 * @param {object|string} Optional: meta
 * @method createAction
 * @return {external:Array<WorkFlow, Triggers, Conditions, Action>}
 */
async function createAction(workflowId, type = workflowRepository.EActionTypes.MESSAGE, meta = {}) {
  return workflowRepository
    .createAction({ workflowId, type, meta });
}

/**
 * Deletes all data in the database
 * @method cleanAll
 */
async function cleanAll() {
  await organisationRepository.deleteAll();

  const networks = await networkRepo.findAll();
  const admins = R.map((network) => network.superAdmin, networks);
  await Promise.all(R.map(deleteUser, admins));

  await userRepo.deleteAll();
  await objectRepo.deleteAll();
  await objectSeenRepo.deleteAll();
  await activityRepo.deleteAll();
  await integrationRepo.deleteAll();
  await pollRepo.deleteAll();
}

exports.DEFAULT_INTEGRATION = DEFAULT_INTEGRATION;
exports.DEFAULT_NETWORK_EXTERNALID = DEFAULT_NETWORK_EXTERNALID;
exports.createTeamInNetwork = createTeamInNetwork;
exports.addUserToNetwork = addUserToNetwork;
exports.addUserToOrganisation = addUserToOrganisation;
exports.addUserToTeam = addUserToTeam;
exports.authenticateUser = authenticateUser;
exports.cleanAll = cleanAll;
exports.createOrganisation = createOrganisation;
exports.createOrganisationFunction = createOrganisationFunction;
exports.createIntegration = createIntegration;
exports.createNetwork = createNetwork;
exports.createNetworkWithIntegration = createNetworkWithIntegration;
exports.createUser = createUser;
exports.createUserForNewNetwork = createUserForNewNetwork;
exports.deleteActivity = deleteActivity;
exports.deleteComment = deleteComment;
exports.deleteExchange = deleteExchange;
exports.deleteIntegration = deleteIntegration;
exports.deletePoll = deletePoll;
exports.deleteUser = deleteUser;
exports.findAllIntegrations = findAllIntegrations;
exports.findAllObjects = findAllObjects;
exports.findAllUsers = findAllUsers;
exports.findAllExchanges = findAllExchanges;
exports.getLoginToken = getLoginToken;
exports.hapiFile = hapiFile;
exports.randomString = randomString;
exports.createCompleteWorkFlow = createCompleteWorkFlow;
exports.createWorkFlow = createWorkFlow;
exports.createTrigger = createTrigger;
exports.createCondition = createCondition;
exports.createAction = createAction;
