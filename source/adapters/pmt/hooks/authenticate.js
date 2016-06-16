import request from 'superagent';

export default (baseStoreUrl, credentials) => {
  const endpoint = `${baseStoreUrl}/login`;

  return request.post(endpoint)
    .type('form')
    .send(credentials)
    .set('api-key', 'flexappeal4rwrs')
    .then(res => {
      const { logged_in_user_token, user_id } = res.body;
      return { name: 'PMT', token: logged_in_user_token, externalId: user_id };
    });
};
