import Promise from 'bluebird';
import { differenceBy, flatten, map, pick, get } from 'lodash';
import createError from '../../../../shared/utils/create-error';
import configurationMail from '../../../../shared/mails/configuration-invite';
import * as mailer from '../../../../shared/services/mailer';
import * as integrationsAdapter from '../../../../shared/utils/integrations-adapter';
import * as networkRepo from '../../../../shared/repositories/network';
import * as userRepo from '../../../../shared/repositories/user';
import * as importService from '../../../integrations/services/import';
import * as userService from '../user';

export const listNetworksForCurrentUser = (payload, message) => {
  return message.credentials.Networks;
};

const getNetworks = async (url) => {
  return await integrationsAdapter.pristineNetworks(url);
};

/**
 * Retrieve prisinte networks from an integration.
 * @method listPristineNetworks
 * @return {Promise} Promise containing collection of network
 * with integrationName and admins for the network.
 */
export const listPristineNetworks = async () => {
  const baseUrl = 'https://partner2.testpmt.nl/rest.php';
  const clients = await integrationsAdapter.clients(baseUrl);

  const networksFromIntegration = flatten(await Promise.map(clients,
    (client) => getNetworks(client.externalId)));
  const networks = await networkRepo.findAll({ attributes: ['externalId'] });
  const pristineNetworks = differenceBy(networksFromIntegration, networks, 'externalId');
  const pristineSelectableNetworks = await Promise.map(pristineNetworks,
    async (pristineNetwork) => {
      const network = { ...pristineNetwork };
      const admins = await integrationsAdapter.adminsFromPristineNetworks(network.externalId);
      network.admins = admins;
      return network;
    });

  return pristineSelectableNetworks;
};

/**
 * Retrieve active users that belong to the network.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.networkId - The id of the network
 * @param {object} message - Object containing meta data
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method listActiveUsersForNetwork
 * @return {Promise} Promise containing collection of users
 */
export const listActiveUsersForNetwork = async (payload, message) => {
  const network = await networkRepo.findNetworkById(payload.networkId);
  const usersFromNetwork = await networkRepo.findActiveUsersForNetwork(network);

  return userService.listUsers({ userIds: map(usersFromNetwork, 'id') }, message);
};

/**
 * imports a prinstine network into the system. it notifies the administrator of that
 * network about further action he can take.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.externalId - the external id of the prisinte network
 * @param {string} payload.name - the name of the pristine network
 * @param {string} payload.integrationName - the name of the integration the network
 * will be a part of
 * @param {string} payload.username - the username of the administrator
 * @param {string} payload.firstName - the firstname of the administrator
 * @param {string} payload.lastName - the lastname of the administrator
 * @param {string} payload.dateOfBirth - the birthdate of the administrator in (YY-MM-DD)
 * @param {string} payload.email - the emailaddress of the administrator
 * @param {string} payload.phoneNum - the phonenumber of the administrator
 * @param {string} payload.userId - the external userId of the administrator
 * @param {boolean} payload.isAdmin - state of the the administrator
 * @param {boolean} payload.isActive - activestate of the the administrator
 * @param {string} payload.teamId - external team id of the administrator
 * @method importPristiniNetwork
 * @return null
 * @throws {exception} - Exception  network already exists 401
 */
export const importPristineNetwork = async (payload) => {
  const USER_PROPS = ['username', 'firstName',
    'lastName', 'dateOfBirth', 'email', 'phoneNum',
    'isAdmin', 'isActive', 'teamId'];

  try {
    const employee = pick(payload, USER_PROPS);
    const networkPayload = pick(payload, ['name']);
    const integrationName = payload.integrationName;

    employee.externalId = get(payload, 'userId');
    networkPayload.externalId = get(payload, 'networkId');

    const user = await userRepo.createUser({ ...employee });
    try {
      const network = await networkRepo.findNetwork({ ...networkPayload });
      if (network) throw createError('401');
    } catch (err) {
      if (err.status_code !== 404) throw err;
      console.log('err', err);
    }

    const newNetwork = await networkRepo.createIntegrationNetwork({
      userId: user.id,
      externalId: networkPayload.externalId,
      name: networkPayload.name,
      integrationName,
    });

    await importService.importNetwork({ networkId: newNetwork.id });
    mailer.send(configurationMail(newNetwork, user));
  } catch (err) {
    if (err.status_code !== 401) throw err;

    throw createError('401');
  }
};
