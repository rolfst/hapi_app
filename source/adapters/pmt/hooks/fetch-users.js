import client from 'adapters/pmt/client';
import userSerializer from 'adapters/pmt/serializers/user';

export default (baseStoreUrl) => async () => {
  try {
    const result = await client.get(`${baseStoreUrl}/users`);

    return result.data.map(userSerializer);
  } catch (err) {
    console.log('Error retrieving users from PMT:', err);

    throw err;
  }
};
