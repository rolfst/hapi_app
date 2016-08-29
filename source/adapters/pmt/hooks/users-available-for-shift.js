import client from 'adapters/pmt/client';
import userSerializer from 'adapters/pmt/serializers/user';

export default (token, baseStoreUrl) => async (shiftId) => {
  try {
    const endpoint = `${baseStoreUrl}/shift/${shiftId}/available`;
    const result = await client.get(endpoint, token);

    return result.users.map(userSerializer);
  } catch (err) {
    console.log('Error retrieving available users for shift from PMT:', err);

    throw err;
  }
};
