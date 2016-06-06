import request from 'superagent';

export default (token, endpoint, method = 'GET', data) => {
  return request(method, endpoint)
    .type('form')
    .set('logged-in-user-token', token)
    .set('api-key', 'flexappeal4rwrs')
    .send(data)
    .then(res => res.body)
    .catch(err => console.log('PMT Client error: ', err.body));
};
