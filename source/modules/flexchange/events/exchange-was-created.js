import newExchangeNotification from 'modules/flexchange/events/listeners/new-exchange-notification';

export default function (exchange) {
  const listeners = [
    newExchangeNotification,
  ];

  return { arguments, listeners };
}
