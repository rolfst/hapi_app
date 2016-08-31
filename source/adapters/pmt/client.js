import request from 'superagent';
import log from 'common/services/logger';
import ExpiredToken from 'common/errors/token-expired';

export function makeRequest(endpoint, token = null, method = 'GET', data = {}) {
  log.info('Calling PMT client', { url: endpoint, method, username: data.username });

  return request(method, endpoint)
    .type('form')
    .set('logged-in-user-token', token)
    .set('api-key', 'testpmtapi')
    .send(data)
    .then(res => {
      log.debug('PMT client responsed with body', { body: res.body });

      return res.body;
    })
    .catch(err => {
      const { body, statusCode } = err.response;

      if (statusCode === 400) {
        log.info('PMT token expired', { username: data.username });
        throw ExpiredToken;
      }

      log.error('PMT Client error', { body: body.error || null, status: statusCode });
    });
}

export default {
  post: (endpoint, token, data) => makeRequest(endpoint, token, 'POST', data),
  get: (endpoint, token) => makeRequest(endpoint, token, 'GET'),
  put: (endpoint, token, data) => makeRequest(endpoint, token, 'PUT', data),
  delete: (endpoint, token) => makeRequest(endpoint, token, 'DELETE'),
};
