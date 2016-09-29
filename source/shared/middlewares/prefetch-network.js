import createError from '../utils/create-error';
import * as serverUtil from '../utils/server';
import * as networkUtil from '../utils/network';

export const selectNetworkForUser = (user, networkIdToSelect) => {
  const selectedNetwork = networkUtil.select(user.Networks, networkIdToSelect);

  if (!selectedNetwork) throw createError('10002');

  const deletedFromNetwork = selectedNetwork.NetworkUser.deletedAt !== null;
  if (deletedFromNetwork) throw createError('10003');

  return selectedNetwork;
};

export default (req, reply) => {
  try {
    const networkId = parseInt(req.params.networkId, 10);
    const selectedNetwork = selectNetworkForUser(req.auth.credentials, networkId);

    return reply(selectedNetwork);
  } catch (err) {
    const errorResponse = serverUtil.transformBoomToErrorResponse(err);

    return reply(errorResponse).code(errorResponse.status_code);
  }
};
