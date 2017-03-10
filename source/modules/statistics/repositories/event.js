import fetch from 'isomorphic-fetch';
import R from 'ramda';
import createError from '../../../shared/utils/create-error';
import * as Logger from '../../../shared/services/logger';

const logger = Logger.createLogger('STATISTICS/repositories/events');

const API_KEY = process.env.MIXPANEL_TOKEN;
const MP_API_JQL_URI = `https://${API_KEY}@mixpanel.com/api/2.0/jql/`;

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
    throw createError('10004');
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
 * @method findAllBy
 * @return {external:Promise<EventStatistic>} {@link
 * module:source/modules/statisctis~EventStatistic EventStatistic}
 */
export async function findAllBy(payload, message) {
  const startDate = payload.startDate.toISOString().substr(0, 10);
  const endDate = payload.endDate.toISOString().substr(0, 10);

  const jql = `
    function main() {
    const createdEventDate = (evt) => evt.properties['Created At'].toISOString().substr(0, 10);

    return Events({
      from_date: '${startDate}',
      to_date:   '${endDate}',
      event_selectors: [{ event: '${payload.event}' }]
    })
    .filter((evt) => (${payload.networkId} === evt.properties['Network Id']))
    .groupBy(["properties.Network Id", createdEventDate], mixpanel.reducer.count())
    .reduce((acc, items) => {
      return items.reduce((acc, item) => {
        const eventDate = item.key[1];

        acc[eventDate] = item.value;

        return acc;
      }, {});
    });
  }
  `;

  const options = {
    method: 'POST',
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: createFormEncodedString({ script: jql }),
  };

  logger.info('Fetching from mixpanel', { options, message });
  const response = await fetch(MP_API_JQL_URI, options);
  const { status, json } = await handleRequest(response, MP_API_JQL_URI);

  if (status !== 200) {
    logger.error('Error occured when fetching data from Mixpanel', {
      status, json, message });
  } else {
    const dataResponse = json[0] || {};
    logger.info('Retrieved data from integration', {
      status, itemCount: dataResponse.length, message });
  }

  return { payload: R.head(json), status };
}
