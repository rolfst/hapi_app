import client from 'adapters/pmt/client';

export default (token) => async (baseStoreUrl, shiftId) => {
  try {
    const endpoint = `${baseStoreUrl}/shift/${shiftId}/available`;
    const result = await client.get(endpoint, token);

    return result.users;
  } catch (err) {
    console.log('Error retrieving available users for shift from PMT:', err);

    throw err;
  }
};
