const createError = require('../../../../shared/utils/create-error');
const userRepo = require('../../../core/repositories/user');

const assertExternalIdNotPresentInNetwork = async (userId, networkId, externalId) => {
  const networkLink = await userRepo.findNetworkLink({ networkId, externalId });

  if (networkLink && networkLink.userId !== userId) {
    throw createError('403', 'Your integration account is already linked with someone else.');
  }

  return false;
};

exports.assertExternalIdNotPresentInNetwork = assertExternalIdNotPresentInNetwork;
