const R = require('ramda');
const fetch = require('isomorphic-fetch');
const Mixpanel = require('mixpanel');
const createError = require('../utils/create-error');

const logger = require('./logger')('SHARED/services/mixpanel');

const API_KEY = process.env.MIXPANEL_TOKEN;
const API_SECRET = process.env.MIXPANEL_SECRET;
const MP_API_JQL_URI = `https://${API_SECRET}@mixpanel.com/api/2.0/jql/`;

function getClient() {
  return Mixpanel.init(API_KEY);
}

function registerProfile(user) {
  if (!user.id) throw new Error('User need to have at least an identifier.');

  const payload = {
    $first_name: user.firstName,
    $last_name: user.lastName,
    $email: user.email,
    $phone: user.phoneNum,
  };

  getClient().people.set(user.id, payload);
}

function track(event, distinctId = null) {
  if (!distinctId) throw new Error('Missing distinctId parameter.');
  logger.debug('Tracking event', { event, distinctId });

  return getClient().track(event.name, R.merge(event.data, { distinct_id: distinctId }));
}


const createFormEncodedString = (data) => {
  return Object.keys(data).map((key) => {
    return `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`;
  }).join('&');
};

async function handleRequest(response, endpoint) {
  let json;
  const status = response.status;
  const undefinedError = `${endpoint}: ${response.statusText}`;

  try {
    json = await response.json();
  } catch (e) {
    json = { error: undefinedError };
  }

  if (status === 403) {
    throw createError('403');
  } else if (status === 404 && json.error === undefinedError) {
    throw createError('10008', json.error);
  } else if (status === 400 && json.error === 'Unable to authenticate request') {
    throw createError('40004');
  } else if (status === 400) {
    throw createError('422');
  }

  return { status, json };
}

/**
 * fetches all events created in mixpanel by event and within a date range
 * @param {object} payload
 * @param {string} payload.event
 * @param {string} payload.networkId
 * @param {date} payload.startDate
 * @param {date} payload.endDate
 * @param {Message} message - {@link module:shared~Message Message}
 * @method executeQuery
 * @return {external:Promise<EventStatistic>} {@link
 * module:source/modules/statisctis~EventStatistic EventStatistic}
 */
async function executeQuery(query, message) {
  const options = {
    method: 'POST',
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: createFormEncodedString({ script: query }),
  };

  logger.debug('Fetching from mixpanel', { options, message });
  const response = await fetch(MP_API_JQL_URI, options);
  const { status, json } = await handleRequest(response, MP_API_JQL_URI);

  let dataResponse = [];
  if (status !== 200) {
    logger.error('Error occured when fetching data from Mixpanel', {
      status, json, message });
  } else {
    // Mxpanel return double array as result and the element in that array is also an array
    dataResponse = Array.isArray(json) && (Array.isArray(R.head(json))) ? R.head(json) : [];

    logger.debug('Retrieved data from integration', {
      status,
      itemCount: dataResponse.length,
      message,
    });
  }

  return { payload: dataResponse, status };
}

exports.executeQuery = executeQuery;
exports.getClient = getClient;
exports.registerProfile = registerProfile;
exports.track = track;
exports.handleRequest = handleRequest;
