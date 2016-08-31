import fetch from 'isomorphic-fetch';
import log from 'common/services/logger';
import ExpiredToken from 'common/errors/token-expired';

export async function makeRequest(endpoint, token = null, method = 'GET', data = {}) {
  log.info('Calling PMT client', { url: endpoint, method, username: data.username });

  const response = await fetch(endpoint, {
    method,
    headers: {
      'api-key': 'testpmtapi',
    },
    body: JSON.stringify(data),
  });

  const json = await response.json();

  if (response.status === 400) {
    log.info('PMT token expired', { username: data.username });
    throw ExpiredToken;
  } else if (!response.ok) {
    log.error('PMT Client error', { json: json.error || null, status_code: response.status });
  }

  log.debug('PMT client responded with json', { json });

  return json;
}

export default {
  post: (endpoint, token, data) => makeRequest(endpoint, token, 'POST', data),
  get: (endpoint, token) => makeRequest(endpoint, token, 'GET'),
  put: (endpoint, token, data) => makeRequest(endpoint, token, 'PUT', data),
  delete: (endpoint, token) => makeRequest(endpoint, token, 'DELETE'),
};
