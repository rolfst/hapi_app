import moment from 'moment';
import * as mixpanel from '../../../../shared/services/mixpanel';
import * as Logger from '../../../../shared/services/logger';

const logger = Logger.createLogger('STATISTICS/service/events');

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

export async function getCreatedMessages(payload, message) {
  logger.info('Retrieving Created Messages', { payload, message });

  const startDate = payload.startDate || moment().subtract(1, 'month').toDate();
  const endDate = payload.endDate || moment().toDate();
  const jql = createEventQuery({
    event: 'Created Message', networkId: payload.networkId, startDate, endDate });

  return mixpanel.executeQuery(jql, message);
}
