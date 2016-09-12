import fetch from 'isomorphic-fetch';
import Boom from 'boom';
import ExpiredToken from 'common/errors/token-expired';

const createFormEncodedString = (data) => {
  return Object.keys(data).map((key) => {
    return `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`;
  }).join('&');
};

export async function makeRequest(endpoint, token = null, method = 'GET', data = {}) {
  try {
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

    console.info('PMT client responded with json', json);

    if (response.status === 400) throw ExpiredToken;
    if (response.status === 401) throw Boom.badData('Wrong data send to integration.');

    return { payload: json, status: response.status };
  } catch (err) {
    console.error('PMT Client error', err);
  }
}

export default {
  post: (endpoint, token, data) => makeRequest(endpoint, token, 'POST', data),
  get: (endpoint, token) => makeRequest(endpoint, token, 'GET'),
  put: (endpoint, token, data) => makeRequest(endpoint, token, 'PUT', data),
  delete: (endpoint, token) => makeRequest(endpoint, token, 'DELETE'),
};
