import request from 'superagent';

export default async (baseStoreUrl, credentials) => {
  try {
    const endpoint = `${baseStoreUrl}/login`;
    const { body } = await request
      .post(endpoint)
      .type('form')
      .send(credentials)
      .set('api-key', 'testpmtapi');

    return { name: 'PMT', token: body.logged_in_user_token, externalId: body.user_id };
  } catch (err) {
    console.log('Could not authenticate with PMT:', err);

    throw err;
  }
};
