import request from 'superagent';

function makeRequest(token, endpoint, method = 'GET', data = {}) {
  return request(method, endpoint)
    .type('form')
    .set('logged-in-user-token', token)
    .set('api-key', 'flexappeal4rwrs')
    .send(data)
    .then(res => res.body)
    .catch(err => console.log('PMT Client error: ', err.body));
}

export default {
  post: (token, endpoint, data) => makeRequest(token, endpoint, 'POST', data),
  get: (token, endpoint) => makeRequest(token, endpoint, 'GET'),
  put: (token, endpoint, data) => makeRequest(token, endpoint, 'PUT', data),
  delete: (token, endpoint) => makeRequest(token, endpoint, 'DELETE'),
};
