import createError from '../../../common/utils/create-error';
import client from '../client';
import userSerializer from '../serializers/user';

export default (baseStoreUrl, token) => async (shiftId) => {
  const endpoint = `${baseStoreUrl}/shift/${shiftId}/available`;
  const result = await client.get(endpoint, token);

  if (result.status === 404) throw createError('404');

  return result.payload.users.map(userSerializer);
};
