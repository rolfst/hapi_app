import client from '../client';
import teamSerializer from '../serializers/team';

export default (baseStoreUrl) => async () => {
  const result = await client.get(`${baseStoreUrl}/departments`);

  return result.payload.departments.map(teamSerializer);
};
