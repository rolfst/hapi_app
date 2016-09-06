import fetch from 'isomorphic-fetch';
import Boom from 'boom';
import log from 'common/services/logger';
import ExpiredToken from 'common/errors/token-expired';

const createFormEncodedString = (data) => {
  return Object.keys(data).map((key) => {
    return `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`;
  }).join('&');
};

export async function makeRequest(endpoint, token = null, method = 'GET', data = {}) {
  try {
    log.info('Calling PMT client', { url: endpoint, method, username: data.username });

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'logged-in-user-token': token,
        'api-key': 'testpmtapi',
      },
      body: createFormEncodedString(data),
    });

    const json = await response.json();

    log.debug('PMT client responded with json', { json });

    console.log(json);

    if (response.status === 400) throw ExpiredToken;
    if (!response.ok) throw Boom.badData(json.error);

    return json;
  } catch (err) {
    log.error('PMT Client error', { err });
  }
}

export default {
  post: (endpoint, token, data) => makeRequest(endpoint, token, 'POST', data),
  get: (endpoint, token) => makeRequest(endpoint, token, 'GET'),
  put: (endpoint, token, data) => makeRequest(endpoint, token, 'PUT', data),
  delete: (endpoint, token) => makeRequest(endpoint, token, 'DELETE'),
};
