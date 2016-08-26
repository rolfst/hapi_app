import { differenceBy } from 'lodash';
import { findTeamsForNetwork } from 'common/repositories/network';
import { createBulkTeams } from 'common/repositories/team';

/**
 * The external team that is loaded from the integration
 * should contain the following properties:
 *
 * - externalId
 * - name
 */

/**
 * @param {array} externalTeams - The serialized teams that are loaded from the integration
 * @param {Network} network - The network object to import the teams into
 * @method importTeams
 * @return {Team} - Return team objects
 */
export default async (externalTeams, network) => {
  const existingTeams = await findTeamsForNetwork(network);
  const teamsToCreate = differenceBy(externalTeams, existingTeams, 'externalId')
    .map(team => ({ ...team, networkId: network.id }));

  const newTeams = await createBulkTeams(teamsToCreate);

  return [...newTeams, ...existingTeams];
};
