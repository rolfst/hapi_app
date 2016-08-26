import client from 'adapters/pmt/client';
import teamSerializer from 'adapters/pmt/serializers/team';

export default (baseStoreUrl) => async () => {
  try {
    const result = await client.get(`${baseStoreUrl}/departments`);

    return result.departments.map(teamSerializer);
  } catch (err) {
    console.log('Error retrieving departments from PMT:', err);

    throw err;
  }
};
