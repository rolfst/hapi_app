import createError from '../../../../shared/utils/create-error';
import { TeamUser } from '../../../repositories/dao';

/**
 * Check if the user has is connected to the team
 * @param {string} teamId - The id of the team
 * @param {string} userId - The id of the user
 * @method assertThatUserBelongsToTheTeam
 * @throws Error - 10010
 */
export const assertThatUserBelongsToTheTeam = async (teamId, userId) => {
  const result = await TeamUser.find({ where: { teamId, userId } });

  if (!result) throw createError('10010');
};
