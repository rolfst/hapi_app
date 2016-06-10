import request from 'superagent';

export default (baseStoreUrl, credentials) => {
  const endpoint = `${baseStoreUrl}/login`;

  return request.post(endpoint)
    .type('form')
    .send(credentials)
    .set('api-key', 'flexappeal4rwrs')
    .then(res => ({ name: 'PMT', token: res.body.logged_in_user_token }));
};
