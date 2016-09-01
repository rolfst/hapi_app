import client from 'adapters/pmt/client';

export default (baseStoreUrl) => async (credentials) => {
  const endpoint = `${baseStoreUrl}/login`;
  const result = await client.post(endpoint, null, credentials);

  return { name: 'PMT', token: result.logged_in_user_token, externalId: result.user_id };
};
