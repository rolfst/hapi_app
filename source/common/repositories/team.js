import Boom from 'boom';
import sequelize from 'sequelize';
import _ from 'lodash';
import { Team } from 'common/models';
import { User } from 'common/models';

export function findTeamById(id) {
  return Team
    .findById(id)
    .then(team => {
      if (!team) throw Boom.notFound(`No team found with id ${id}.`);

      return team;
    });
}

export function createTeam(networkId, name, description) {
  return Team
    .create({ networkId, name, description });
}

export async function validateTeamIds(ids, networkId) {
  const teamsCount = await Team.count({
    where: {
      id: { $in: ids },
      networkId,
    },
  });

  return teamsCount === ids.length;
}

export function findUsersByTeamIds(ids) {
  return User
    .findAll({
      include: [{ model: Team }],
      where: sequelize.where(sequelize.col('Teams.id'), { $in: ids }),
    });
}
