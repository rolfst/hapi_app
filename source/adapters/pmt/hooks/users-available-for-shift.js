import Boom from 'boom';
import client from '../client';
import userSerializer from '../serializers/user';

export default (baseStoreUrl, token) => async (shiftId) => {
  const endpoint = `${baseStoreUrl}/shift/${shiftId}/available`;
  const result = await client.get(endpoint, token);

  if (result.status === 404) throw Boom.notFound('Shift not found.');

  return result.payload.users.map(userSerializer);
};
