import createError from '../../../../shared/utils/create-error';
import * as userRepo from '../../../core/repositories/user';

export const assertExternalIdNotPresentInNetwork = async (userId, networkId, externalId) => {
  const networkLink = await userRepo.findNetworkLink({ networkId, externalId });

  if (networkLink && networkLink.userId !== userId) {
    throw createError('403', 'Your integration account is already linked with someone else.');
  }

  return false;
};
