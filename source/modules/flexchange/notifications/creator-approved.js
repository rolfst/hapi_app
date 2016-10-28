import moment from 'moment';
import 'moment/locale/nl';
import notifier from '../../../shared/services/notifier';
import * as notificationUtils from '../utils/notification';

moment.locale('nl');

export const createNotification = (exchange) => {
  const date = moment(exchange.date).calendar(null, {
    sameDay: '[van] [vandaag]',
    nextDay: '[van] [morgen]',
    nextWeek: '[van] dddd',
    sameElse: '[op] dddd DD MMMM',
  });

  return {
    text: `${exchange.ApprovedUser.fullName} heeft je shift ${date} van ` +
      `${notificationUtils.createTimeText(exchange)} overgenomen.`,
    data: { id: exchange.id, type: 'exchange' },
  };
};

export const send = async (exchange) => {
  const notification = createNotification(exchange);

  return notifier.send([exchange.User], notification);
};
