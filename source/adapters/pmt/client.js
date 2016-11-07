import fetch from 'isomorphic-fetch';
import createError from '../../shared/utils/create-error';
import * as Logger from '../../shared/services/logger';

const logger = Logger.getLogger('PMT/adapter/client');

const createFormEncodedString = (data) => {
  return Object.keys(data).map((key) => {
    return `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`;
  }).join('&');
};

const handleError = (status, body) => {
  if (status === 400 && body.error.toLowerCase().match(/token|expired/g)) {
    throw createError('10005');
  } else if (status === 403) {
    throw createError('403');
  } else if (status === 400) {
    throw createError('422');
  } else if (status === 401 && body.error === 'Incorrect username or password.') {
    throw createError('10004');
  }
};

export async function makeRequest(endpoint, token = null, method = 'GET', data = {}, message) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'logged-in-user-token': token,
      'api-key': 'testpmtapi',
    },
    body: createFormEncodedString(data),
  };

  logger.info('fetching from integration', { options, message });
  const response = await fetch(endpoint, options);
  const json = await response.json();
  logger.info('Retrieved from integration', { status: response.status, json, message });

  handleError(response.status, json);

  return { payload: json, status: response.status };
}

export default {
  post: (endpoint, token, data, message) => makeRequest(endpoint, token, 'POST', data, message),
  get: (endpoint, token, message) => makeRequest(endpoint, token, 'GET', message),
  put: (endpoint, token, data, message) => makeRequest(endpoint, token, 'PUT', data, message),
  delete: (endpoint, token, message) => makeRequest(endpoint, token, 'DELETE', message),
};
