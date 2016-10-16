import client from '../client';
import userSerializer from '../serializers/user';

export default (baseStoreUrl) => async () => {
  const result = await client.get(`${baseStoreUrl}/users`);

  return result.payload.data.map(userSerializer);
};
