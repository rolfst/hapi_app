import request from 'superagent';
import ExpiredToken from 'common/errors/token-expired';

function makeRequest(endpoint, token = null, method = 'GET', data = {}) {
  return request(method, endpoint)
    .type('form')
    .set('logged-in-user-token', token)
    .set('api-key', 'testpmtapi')
    .send(data)
    .then(res => res.body)
    .catch(err => {
      if (err.response.statusCode === 400) throw ExpiredToken;
      else console.log('PMT Client error: ', err);
    });
}

export default {
  post: (endpoint, token, data) => makeRequest(endpoint, token, 'POST', data),
  get: (endpoint, token) => makeRequest(endpoint, token, 'GET'),
  put: (endpoint, token, data) => makeRequest(endpoint, token, 'PUT', data),
  delete: (endpoint, token) => makeRequest(endpoint, token, 'DELETE'),
};
