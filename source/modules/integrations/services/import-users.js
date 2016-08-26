import { differenceBy, intersectionBy } from 'lodash';
import { addUserToNetwork, createBulkUsers } from 'common/repositories/user';
import findExternalUser from 'modules/integrations/services/find-external-user';

/**
 * The external user that is loaded from the integration
 * should contain the following properties:
 *
 * - externalId
 * - username
 * - email
 * - firstName
 * - lastName
 * - dateOfBirth
 * - phoneNum
 * - isAdmin
 * - isActive
 * - teamId
 */

/**
 * We import the users that are being loaded by the external integration.
 * A user is created when the external user is not present in the db.
 * When the user is present in the db they will get added
 * to the network and not be created nor updated.
 * So we can import existing and new users here.
 * @param {array} internalUsers - List of user objects
 * @param {array} externalUsers - The serialized users that are loaded from the integration
 * @param {Network} network - The network object to import the users into
 * @method importUsers
 * @return {User} - Return user objects
 */
export default async (internalUsers, externalUsers, network) => {
  const newExternalUsers = differenceBy(externalUsers, internalUsers, 'email');
  const newUsers = await createBulkUsers(newExternalUsers);
  const existingUsers = intersectionBy(internalUsers, externalUsers, 'email');

  const usersToAddToNetwork = [...newUsers, ...existingUsers];

  const promises = usersToAddToNetwork.map(employee => {
    const externalUser = findExternalUser(employee, externalUsers);

    return addUserToNetwork(employee, network, {
      isActive: externalUser.isActive,
      externalId: externalUser.externalId,
      roleType: externalUser.isAdmin ? 'ADMIN' : 'EMPLOYEE',
    });
  });

  return Promise.all(promises);
};
