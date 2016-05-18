import Boom from 'boom';
import { Team } from 'common/models';

export function findTeamById(id) {
  return Team
    .findById(id)
    .then(team => {
      if (!team) throw Boom.notFound(`No team found with id ${id}.`);

      return team;
    });
}
