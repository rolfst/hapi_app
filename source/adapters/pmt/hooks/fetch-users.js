import client from 'adapters/pmt/client';
import userSerializer from 'adapters/pmt/serializers/user';

export default (baseStoreUrl) => async () => {
  const result = await client.get(`${baseStoreUrl}/users`);

  return result.payload.data.map(userSerializer);
};
