import moment from 'moment';
import * as eventRepo from '../../repositories/event';
import * as Logger from '../../../../shared/services/logger';

const logger = Logger.createLogger('STATISTICS/service/events');

async function getEventStats(event, networkId, startDate, endDate) {
  return eventRepo.findAllBy({ event, networkId, startDate, endDate });
}

export async function getCreatedMessages(payload, message) {
  logger.info('Retrieving Created Messages', { payload, message });

  const startDate = payload.startDate || moment().subtract(1, 'month').toDate();
  const endDate = payload.endDate || moment().toDate();

  return getEventStats('Created Message', payload.networkId, startDate, endDate);
}
