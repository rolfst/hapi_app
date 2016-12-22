import fetch from 'isomorphic-fetch';
import createError from '../../shared/utils/create-error';
import * as Logger from '../../shared/services/logger';

const logger = Logger.createLogger('PMT/adapter/client');

const createFormEncodedString = (data) => {
  return Object.keys(data).map((key) => {
    return `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`;
  }).join('&');
};

const handleRequest = async (response, endpoint) => {
  let json;
  const status = response.status;
  const undefinedError = `${endpoint}: ${response.statusText}`;

  try {
    json = await response.json();
  } catch (e) {
    json = { error: undefinedError };
  }

  if (status === 400 && json.error.toLowerCase().match(/token|expired/g)) {
    throw createError('10005');
  } else if (status === 403) {
    throw createError('403');
  } else if (status === 400) {
    throw createError('422');
  } else if (status === 404 && json.error === undefinedError) {
    throw createError('10008', json.error);
  } else if (status === 401 && json.error === 'Incorrect username or password.') {
    throw createError('10004');
  }

  return { status, json };
};

export async function makeRequest(endpoint, token = null, method = 'GET', data = {}, message) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'logged-in-user-token': token,
      'api-key': process.env.PMT_API_KEY || 'testpmtapi',
    },
    body: createFormEncodedString(data),
  };


  logger.info('Fetching from integration', { endpoint, options, message });
  const response = await fetch(endpoint, options);
  const { status, json } = await handleRequest(response, endpoint);

  if (status !== 200) {
    logger.error('Error occured when fetching data from integration', {
      status, json, message, endpoint });
  } else {
    const dataResponse = json[Object.keys(json)[0]] || [];
    logger.info('Retrieved data from integration', {
      status, itemCount: dataResponse.length, message, endpoint });
  }

  return { payload: json, status };
}

export default {
  post: (endpoint, token, data, message) => makeRequest(endpoint, token, 'POST', data, message),
  get: (endpoint, token, message) => makeRequest(endpoint, token, 'GET', message),
  put: (endpoint, token, data, message) => makeRequest(endpoint, token, 'PUT', data, message),
  delete: (endpoint, token, message) => makeRequest(endpoint, token, 'DELETE', message),
};
