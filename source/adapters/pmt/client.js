import request from 'superagent';

function makeRequest(endpoint, token = null, method = 'GET', data = {}) {
  return request(method, endpoint)
    .type('form')
    .set('logged-in-user-token', token)
    .set('api-key', 'flexappeal4rwrs')
    .send(data)
    .then(res => res.body)
    .catch(err => console.log('PMT Client error: ', err));
}

export default {
  post: (endpoint, token, data) => makeRequest(endpoint, token, 'POST', data),
  get: (endpoint, token) => makeRequest(endpoint, token, 'GET'),
  put: (endpoint, token, data) => makeRequest(endpoint, token, 'PUT', data),
  delete: (endpoint, token) => makeRequest(endpoint, token, 'DELETE'),
};
