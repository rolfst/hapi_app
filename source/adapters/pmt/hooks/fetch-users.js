import { map } from 'lodash';
import client from '../client';
import userSerializer from '../serializers/user';

export default (baseStoreUrl) => async () => {
  const result = await client.get(`${baseStoreUrl}/users`);

  return map(result.payload.data, userSerializer);
};
