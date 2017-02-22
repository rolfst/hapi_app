import createError from '../../../../shared/utils/create-error';
import { TeamUser } from '../../../../shared/models';

export const assertThatUserBelongsToTheTeam = async (teamId, userId) => {
  const result = await TeamUser.find({ where: { teamId, userId } });

  if (!result) throw createError('10010');
};
