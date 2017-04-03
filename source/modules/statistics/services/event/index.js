const R = require('ramda');
const moment = require('moment');
const Mixpanel = require('../../../../shared/services/mixpanel');
const createError = require('../../../../shared/utils/create-error');
const createdMessageQuery = require('./queries/created-message');
const createdShiftQuery = require('./queries/created-shift');
const approvedShiftQuery = require('./queries/approved-shift');

const logger = require('../../../../shared/services/logger')('STATISTICS/service/events');

const defaultToMonth = R.defaultTo('month');

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
 * @param {string} payload.unit - the unit for the query
 * @param  {string} payload.networkId - the network identifier to search within
 * @param  {string} payload.type - the type for which the query is build .eg user, team
 * @param {date} payload.startDate - begining of query
 * @param {date} payload.endDate - end of query
 * @return {string} - jql query
 */
function createEventQuery(payload) {
  const unit = defaultToMonth(payload.unit);
  const { startDate, endDate } = createDateRange(unit, payload.startDate, payload.endDate);
  const idTypes = {
    user: 'distinct_id',
    team: 'properties["Team Id"]',
  };
  const idTypesCode = {
    user: 'distinct_id',
    team: 'properties.Team Id',
  };
  const idType = idTypes[payload.type];
  const idTypeCode = idTypesCode[payload.type];

  return {
    networkId: payload.networkId,
    type: payload.type,
    idType,
    idTypeCode,
    startDate,
    endDate,
  };
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
  logger.debug('Retrieving Created Messages', { payload, message });

  const queryParams = createEventQuery(payload);
  const jql = createdMessageQuery(queryParams);

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
  logger.debug('Retrieving Approved shifts', { payload, message });

  const queryParams = createEventQuery(payload);
  const jql = approvedShiftQuery(queryParams);

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
  logger.debug('Retrieving Created shifts', { payload, message });

  const queryParams = createEventQuery(payload);
  const jql = createdShiftQuery(queryParams);

  return Mixpanel.executeQuery(jql, message);
}

exports.getApprovedShifts = getApprovedShifts;
exports.getCreatedMessages = getCreatedMessages;
exports.getCreatedShifts = getCreatedShifts;
