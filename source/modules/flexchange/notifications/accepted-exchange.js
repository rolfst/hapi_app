const notifier = require('../../../shared/services/notifier');
const networkRepo = require('../../core/repositories/network');

const createNotification = (exchange, substituteUser) => {
  const substitute = substituteUser.fullName;
  const creator = exchange.User.fullName;

  return {
    text: `${substitute} heeft aangegeven de shift van ${creator}` +
    ' te kunnen werken.',
    data: { id: exchange.id, type: 'exchange', track_name: 'accepted_exchange' },
  };
};

const send = async (network, exchange, userThatAccepts) => {
  const admins = await networkRepo.findUsersForNetwork(network.id, { roleType: 'ADMIN' });
  const usersToNotify = admins.filter(u => u.id !== userThatAccepts.id);
  const notification = createNotification(exchange, userThatAccepts);

  return notifier.send(usersToNotify, notification);
};

// exports of functions
module.exports = {
  createNotification,
  send,
};
