import client from 'adapters/pmt/client';
import teamSerializer from 'adapters/pmt/serializers/team';

export default (baseStoreUrl) => async () => {
  const result = await client.get(`${baseStoreUrl}/departments`);

  return result.departments.map(teamSerializer);
};
