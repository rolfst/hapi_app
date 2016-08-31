import client from 'adapters/pmt/client';
import userSerializer from 'adapters/pmt/serializers/user';

export default (token, baseStoreUrl) => async (shiftId) => {
  const endpoint = `${baseStoreUrl}/shift/${shiftId}/available`;
  const result = await client.get(endpoint, token);

  return result.users.map(userSerializer);
};
