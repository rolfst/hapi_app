const R = require('ramda');
const moment = require('moment');
const Mixpanel = require('../../../../shared/services/mixpanel');
const createError = require('../../../../shared/utils/create-error');
const Logger = require('../../../../shared/services/logger');

const logger = Logger.createLogger('STATISTICS/service/events');

const defaultToMonth = R.defaultTo('month');

/**
 * Creates an EventQuery script for mixpanel
 * @param  {object} payload - the container for the query properties
 * @param  {string} payload.event - the metric that is queried
 * @param  {string} payload.networkId - the network identifier to search within
 * @param  {string} payload.idType - the field for which the metric is grouped by
 * @param  {string} payload.type - the type for which the query is build .eg user, team
 * @param {date} payload.startDate - begining of query
 * @param {date} payload.endDate - end of query
 * @return string - the query to be used
 */
function createEventQueryString(payload) {
  const startDate = payload.startDate.toISOString().substr(0, 10);
  const endDate = payload.endDate.toISOString().substr(0, 10);

  return `
    function main() {
      const createdEventDate = (tuple) => tuple.event.properties['Created At'].toISOString().substr(0, 10);

      return join(
        Events({
          from_date: '${startDate}',
          to_date:   '${endDate}',
          event_selectors: [{
            event: '${payload.event}',
            selector: 'properties["Network Id"] == ${payload.networkId}' }]
        }),
        People(),
        {type: 'left'}
      )
      .filter((tuple) => tuple.event.${payload.idType})
      .groupBy(['${payload.idType}', createdEventDate], mixpanel.reducer.count())
      .reduce((acc, items) => {
        return items.reduce((acc, item) => {
          const id = item.key[0];
          const eventDate = item.key[1];

          if (!acc[id]) acc[id] = { type: '${payload.type}', id, values: {} };
          acc[id].values[eventDate] = item.value;

          return acc;
        }, {});
      })
      .map((item) => {
        return Object.keys(item).map((key) => item[key]);
      })
  } `;
}

/*
 * @param {string} unit the range of time that will be returned "month, week, days
 * @param {date} [start]
 * @param {date} [end]
 * @method createDateRange
 * @return {object} - {startDate, endDate}
 */
function createDateRange(unit, start, end) {
  if (!['month', 'week', 'days'].includes(unit)) throw createError('500');

  const startDate = start || moment().subtract(1, unit).toDate();
  const endDate = end || moment().toDate();

  return { startDate, endDate };
}

 /**
 * @param  {string} eventName - the metric that is queried
 * @param  {object} payload - the container for the query properties
 * @param  {string} payload.networkId - the network identifier to search within
 * @param  {string} payload.type - the type for which the query is build .eg user, team
 * @param {date} payload.startDate - begining of query
 * @param {date} payload.endDate - end of query
 * @return {string} - jql query
 */
function createEventQuery(eventName, payload) {
  const unit = defaultToMonth(payload.unit);
  const { startDate, endDate } = createDateRange(unit, payload.startDate, payload.endDate);
  const idTypes = {
    user: 'distinct_id',
    team: 'properties["Team Id"]',
  };
  const idType = idTypes[payload.type];

  return createEventQueryString(R.merge({ event: eventName },
    { networkId: payload.networkId, type: payload.type, idType, startDate, endDate }));
}
/*
 * @param {object} payload
 * @param {string} payload.networkId
 * @param {date} [payload.startDate]
 * @param {date} [payload.endDate]
 * @method getCreatedMessages
 * @return {external:Promise.<Statistic>} - {@link
 * module:modules/statistics~EventStatistic EventStatistic}
 */
async function getCreatedMessages(payload, message) {
  logger.info('Retrieving Created Messages', { payload, message });

  const jql = createEventQuery('Created Message', payload);

  return Mixpanel.executeQuery(jql, message);
}

/*
 * @param {object} payload
 * @param {string} payload.networkId
 * @param {date} [payload.startDate]
 * @param {date} [payload.endDate]
 * @method getApprovedShifts
 * @return {external:Promise.<Statistic>} - {@link
 * module:modules/statistics~EventStatistic EventStatistic}
 */
async function getApprovedShifts(payload, message) {
  logger.info('Retrieving Approved shifts', { payload, message });

  const jql = createEventQuery('Shift Takeover', payload);

  return Mixpanel.executeQuery(jql, message);
}

/*
 * @param {object} payload
 * @param {string} payload.networkId
 * @param {date} [payload.startDate]
 * @param {date} [payload.endDate]
 * @method getCreatedShifts
 * @return {external:Promise.<Statistic>} - {@link
 * module:modules/statistics~EventStatistic EventStatistic}
 */
async function getCreatedShifts(payload, message) {
  logger.info('Retrieving Created shifts', { payload, message });

  const jql = createEventQuery('Created Shift', payload);

  return Mixpanel.executeQuery(jql, message);
}

exports.getApprovedShifts = getApprovedShifts;
exports.getCreatedMessages = getCreatedMessages;
exports.getCreatedShifts = getCreatedShifts;
