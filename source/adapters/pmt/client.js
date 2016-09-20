import fetch from 'isomorphic-fetch';
import createError from '../../shared/utils/create-error';

const createFormEncodedString = (data) => {
  return Object.keys(data).map((key) => {
    return `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`;
  }).join('&');
};

const handleError = (status, body) => {
  if (status === 400 && body.error === 'Token is expired.' || status === 401) {
    throw createError('401');
  } else if (status === 400) {
    throw createError('422');
  } else if (status === 403) {
    throw createError('403');
  }
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

    handleError(response.status, json);

    return { payload: json, status: response.status };
  } catch (err) {
    console.error('PMT Client error', err);
    throw err;
  }
}

export default {
  post: (endpoint, token, data) => makeRequest(endpoint, token, 'POST', data),
  get: (endpoint, token) => makeRequest(endpoint, token, 'GET'),
  put: (endpoint, token, data) => makeRequest(endpoint, token, 'PUT', data),
  delete: (endpoint, token) => makeRequest(endpoint, token, 'DELETE'),
};
