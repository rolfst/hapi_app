const { map, intersectionBy, reject } = require('lodash');
const Promise = require('bluebird');
const passwordUtil = require('../../../shared/utils/password');
const mailer = require('../../../shared/services/mailer');
const UserRoles = require('../../../shared/services/permission');
const createError = require('../../../shared/utils/create-error');
const signupMail = require('../../../shared/mails/signup');
const signupInOrganisationMail = require('../../../shared/mails/signup-in-organisation');
const addedToNetworkMail = require('../../../shared/mails/added-to-network');
const addedToNetworksInOrganisationMail = require('../../../shared/mails/added-to-networks-in-organisation');
const addedToOrganisationMail = require('../../../shared/mails/added-to-organisation');
const userService = require('../../core/services/user');
const networkRepo = require('../../core/repositories/network');
const userRepo = require('../../core/repositories/user');
const teamRepo = require('../../core/repositories/team');
const organisationService = require('../../core/services/organisation');
const organisationRepo = require('../../core/repositories/organisation');
const EmployeeDispatcher = require('../dispatcher');
const impl = require('./implementation');
const { ERoleTypes } = require('../../authorization/definitions');

/**
 * @module modules/employee/services/inviteUser
 */

const EUserStates = {
  NEW_USER: 'new',
  EXISTING_USER_IN_ORGANISATION: 'existing_in_organisation',
  EXISTING_USER_NOT_IN_ORGANISATION: 'existing_not_in_organisation',
};

const addToNetworks = async (networks, user) => {
  return Promise.map(networks, (network) => networkRepo.addUser({
    userId: user.id,
    networkId: network.id,
    roleType: network.roleType,
    invitedAt: new Date(),
  }));
};

/**
 * Invites a new user to a network
 * @param {Network} network - network to invite into
 * @param {object} payload - The user properties for the new user
 * @param {string} payload.firstName - The first name of the user
 * @param {string} payload.lastName - The last name of the user
 * @param {string} payload.email - The email of the user
 * @param {string} payload.roleType - The {@link module:shared~UserRoles roletype} of the
 * user in the integration
 * @method inviteNewUser
 * @return {external:Promise.<User>} {@link module:modules/core~User} Promise containing
 * the invited user
 */
const inviteNewUser = async (network, { firstName, lastName, email, roleType }) => {
  const plainPassword = passwordUtil.plainRandom();
  const attributes = {
    firstName,
    lastName,
    username: email,
    email,
    password: plainPassword,
  };

  const user = await userRepo.createUser(attributes);
  await networkRepo.addUser({
    userId: user.id,
    networkId: network.id,
    roleType,
    invitedAt: new Date(),
  });

  mailer.send(signupMail(network, user, plainPassword));

  return user;
};

/**
 * Invites an existing user to a network
 * @param {Network} network - network to invite into
 * @param {User} user - The {@link module:modules/core~user User} to update
 * @param {string} payload.roleType - The {@link module:shared~UserRoles roletype} of the
 * user in the integration
 * @method inviteExistingUser
 * @return {external:Promise.<User>} {@link module:modules/core~User} Promise containing
 * the invited user
 */
const inviteExistingUser = async (network, user, roleType) => {
  const userBelongsToNetwork = await userRepo.userBelongsToNetwork(user.id, network.id);
  const networkId = network.id;
  const userId = user.id;

  if (userBelongsToNetwork) {
    throw createError('403', 'User with the same email already in this network.');
  } else {
    await networkRepo.addUser({
      userId,
      networkId,
      roleType,
      invitedAt: new Date(),
    });
  }

  await userRepo.setNetworkLink({
    networkId, userId,
  }, { networkId, userId, roleType, deletedAt: null, invitedAt: new Date() });

  mailer.send(addedToNetworkMail(network, user));

  return user;
};

/**
 * Invites a user to a network
 * @param {Network} network - network to invite into
 * @param {object} payload - The user properties for the new user
 * @param {string} payload.firstName - The first name of the user
 * @param {string} payload.lastName - The last name of the user
 * @param {string} payload.email - The email of the user
 * @param {string} payload.roleType - The {@link module:shared~UserRoles roletype} of the
 * user in the integration
 * @param {string[]} payload.teamIds - The teams the user will belong to
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method inviteUser
 * @return {external:Promise.<User>} {@link module:modules/core~User} Promise containing the
 * invited user
 */
const inviteUser = async (payload, message) => {
  const { firstName, lastName, email, teamIds, roleType } = payload;
  const { network } = message;

  const role = roleType ? roleType.toUpperCase() : ERoleTypes.EMPLOYEE;
  let user = await userRepo.findUserBy({ email });

  if (user) {
    await inviteExistingUser(network, user, role);
  } else {
    user = await inviteNewUser(network, { firstName, lastName, email, roleType: role });
  }

  if (teamIds && teamIds.length > 0) await teamRepo.addUserToTeams(teamIds, user.id);

  if (network.organisationId) {
    const organisationUser = await organisationRepo.getPivot(user.id, network.organisationId);
    if (!organisationUser) await organisationRepo.addUser(user.id, network.organisationId);
  }

  const createdUser = await userService.getUserWithNetworkScope({
    id: user.id, networkId: network.id });

  EmployeeDispatcher.emit('user.created', {
    user: createdUser,
    network: message.network,
    credentials: message.credentials,
  });

  return createdUser;
};


/**
 * Invites multiple users to a network
 * @param {object} payload - The user properties for the new user
 * @param {string[]} payload.userIds - The user ids to invite
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method inviteUsers
 * @return {void}
 */
const inviteUsers = async (payload, message) => {
  const { network } = message;
  const identifiedUser = await userService.getUserWithNetworkScope({
    id: message.credentials.id, networkId: network.id }, message);
  const userBelongsToNetwork = await userRepo.userBelongsToNetwork(identifiedUser.id, network.id);

  if (!userBelongsToNetwork || identifiedUser.roleType !== UserRoles.ADMIN) {
    throw createError('403');
  }

  const networkMembers = await userService.listUsersWithNetworkScope({
    userIds: payload.userIds, networkId: network.id }, message);

  const preparedUsers = reject(networkMembers, 'invitedAt');
  const toNotifyUsers = intersectionBy(preparedUsers, networkMembers, 'id');
  const usersToSendMailto = await impl.generatePasswordsForMembers(toNotifyUsers);

  await Promise.map((usersToSendMailto), (user) =>
    userRepo.setNetworkLink({ userId: user.id, networkId: network.id }, {
      invitedAt: new Date(), userId: user.id, networkId: network.id }));

  map(usersToSendMailto, (user) => mailer.send(signupMail(network, user, user.plainPassword)));
};


/**
 * Invites a new user to an organisation
 * @param {Network} organisation - organisation to invite into
 * @param {object} payload - The user properties for the new user
 * @param {string} user - The user
 * @param {string} roleType - The {@link module:shared~UserRoles roletype} of the
 * user in the integration
 * @param {object} networks - network objects
 * @method inviteNewUserToOrganisation
 * @return {external:Promise.<User>} {@link module:modules/core~User} Promise containing
 * the invited user
 */
const inviteNewUserToOrganisation = async (
  organisation, user, roleType, networks, plainPassword, message) => {
  const invitedAt = new Date();
  await Promise.all([
    organisationService.addUser(
      { organisationId: organisation.id, userId: user.id, roleType, invitedAt },
      message
    ),
    Promise.map(networks, (network) => networkRepo.addUser({
      userId: user.id,
      networkId: network.id,
      roleType: network.roleType || ERoleTypes.EMPLOYEE,
      invitedAt,
    })),
  ]);

  mailer.send(signupInOrganisationMail(organisation, user, plainPassword, message.credentials));

  return user;
};

const findUserState = async (organisation, user) => {
  if (!user) {
    return EUserStates.NEW_USER;
  } else if (await organisationService.userHasRoleInOrganisation(organisation.id, user.id)) {
    return EUserStates.EXISTING_USER_IN_ORGANISATION;
  }
  return EUserStates.EXISTING_USER_NOT_IN_ORGANISATION;
};

/**
 * Invites a user to an organisation
 * @param {object} payload - The user properties for the new user
 * @param {string} payload.firstName - The first name of the user
 * @param {string} payload.lastName - The last name of the user
 * @param {string} payload.email - The email of the user
 * @param {string} payload.roleType - The {@link module:shared~UserRoles roletype} of the
 * user in the integration
 * @param {Network[]} payload.networks - networks to assign to
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method inviteUserToOrganisation
 * @return {external:Promise.<User>} {@link module:modules/core~User} Promise containing the
 * invited user
 */
const inviteUserToOrganisation = async (payload, message) => {
  const { firstName, lastName, email, roleType, networks } = payload;

  await organisationService.assertUserIsAdminInOrganisation(
    payload.organisationId, message.credentials.id);
  const organisation = await organisationService.getOrganisation(
    { organisationId: payload.organisationId },
    message
  );

  const role = roleType ? roleType.toUpperCase() : ERoleTypes.EMPLOYEE;
  let user = await userRepo.findUserBy({ email });
  const userState = await findUserState(organisation, user);

  switch (userState) {
    case EUserStates.EXISTING_USER_NOT_IN_ORGANISATION:
      await (async () => {
        await organisationService.addUser(
          {
            organisationId: organisation.id,
            userId: user.id,
            roleType: role,
            invitedAt: new Date(),
          },
          message
        );
        await addToNetworks(networks, user);
        mailer.send(addedToOrganisationMail(organisation, user, message.credentials));
      })();
      break;
    case EUserStates.EXISTING_USER_IN_ORGANISATION:
      await (async () => {
        await addToNetworks(networks, user);
        mailer.send(addedToNetworksInOrganisationMail(organisation, user, message));
      })();
      break;
    default:
      await (async () => {
        const plainPassword = passwordUtil.plainRandom();
        const attributes = {
          firstName,
          lastName,
          username: email,
          email,
          password: plainPassword,
        };
        user = await userRepo.createUser(attributes);
        user = await inviteNewUserToOrganisation(
          organisation, user, role, networks, plainPassword, message);
      })();
      break;
  }
  user = await userRepo.findUserBy({ email, organisationId: organisation.id });

  const createdUser = await userService.getScoped({ id: user.id }, message);

 // TODO create working dispatcher
 // EmployeeDispatcher.emit('user.created', {
 //   user: createdUser,
 //   organisation,
 //   credentials: message.credentials,
 // });

  return createdUser;
};

exports.inviteExistingUser = inviteExistingUser;
exports.inviteNewUser = inviteNewUser;
exports.inviteUser = inviteUser;
exports.inviteUsers = inviteUsers;
exports.inviteUserToOrganisation = inviteUserToOrganisation;
