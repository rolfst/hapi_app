import R from 'ramda';
import moment from 'moment';
import * as Mixpanel from '../../../../shared/services/mixpanel';
import createError from '../../../../shared/utils/create-error';
import * as Logger from '../../../../shared/services/logger';

const logger = Logger.createLogger('STATISTICS/service/events');

const defaultToMonth = R.defaultTo('month');

function createEventQuery(payload) {
  const startDate = payload.startDate.toISOString().substr(0, 10);
  const endDate = payload.endDate.toISOString().substr(0, 10);

  return `
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

/*
 * @param {string} networkId
 * @param {date} [startDate]
 * @param {date} [endDate]
 * @method getCreatedMessages
 * @return {external:Promise.<Statistic>} - {@link
 * module:modules/statistics~EventStatistic EventStatistic}
 */
export async function getCreatedMessages(payload, message) {
  logger.info('Retrieving Created Messages', { payload, message });

  const unit = defaultToMonth(payload.unit);
  const { startDate, endDate } = createDateRange(unit, payload.startDate, payload.endDate);
  const jql = createEventQuery({
    event: 'Created Message', networkId: payload.networkId, startDate, endDate });

  return Mixpanel.executeQuery(jql, message);
}

/*
 * @param {string} networkId
 * @param {date} [startDate]
 * @param {date} [endDate]
 * @method getApprovedShifts
 * @return {external:Promise.<Statistic>} - {@link
 * module:modules/statistics~EventStatistic EventStatistic}
 */
export async function getApprovedShifts(payload, message) {
  logger.info('Retrieving Approved shifts', { payload, message });

  const unit = defaultToMonth(payload.unit);
  const { startDate, endDate } = createDateRange(unit, payload.startDate, payload.endDate);
  const jql = createEventQuery({
    event: 'Shift Takeover', networkId: payload.networkId, startDate, endDate });

  return Mixpanel.executeQuery(jql, message);
}
