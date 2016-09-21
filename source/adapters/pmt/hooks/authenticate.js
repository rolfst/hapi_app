import client from '../client';

export default (baseStoreUrl) => async (credentials) => {
  const endpoint = `${baseStoreUrl}/login`;
  try {
    const { payload } = await client.post(endpoint, null, credentials);

    return { name: 'PMT', token: payload.logged_in_user_token, externalId: payload.user_id };
  } catch (err) {
    throw err;
  }
};
