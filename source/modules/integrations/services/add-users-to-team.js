import { find } from 'lodash';
import { addUserToTeam } from 'common/repositories/team';
import findExternalUser from 'modules/integrations/services/find-external-user';

export default (users, teams, externalUsers) => {
  const promises = users.map(user => {
    const teamId = findExternalUser(user, externalUsers).teamId;
    const team = find(teams, { externalId: teamId });

    return addUserToTeam(team, user);
  });

  return Promise.all(promises);
};
