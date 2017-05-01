const notifier = require('../../../shared/services/notifier');
const networkRepo = require('../../core/repositories/network');
const exchangeRepo = require('../repositories/exchange');

const createNotification = (exchange, substituteUser) => {
  const substitute = substituteUser.fullName;
  const creator = exchange.User.fullName;

  return {
    text: `${substitute} heeft aangegeven de shift van ${creator}` +
    ' te kunnen werken.',
    data: { id: exchange.id, type: 'exchange', track_name: 'accepted_exchange' },
  };
};

const send = async (network, exchangeId, userThatAccepts) => {
  const [admins, exchange] = await Promise.all([
    networkRepo.findUsersForNetwork(network.id, { roleType: 'ADMIN' }),
    exchangeRepo.findExchangeById(exchangeId),
  ]);

  const usersToNotify = admins.filter((u) => u.id !== userThatAccepts.id);
  const notification = createNotification(exchange, userThatAccepts);

  notifier.send(usersToNotify, notification);
};

exports.createNotification = createNotification;
exports.send = send;
