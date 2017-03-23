const newExchangeNotification = (exchange) => { // eslint-disable-line no-unused-vars
  // TODO: Fire notification
};

const trackNewExchange = (exchange) => { // eslint-disable-line no-unused-vars
  // TODO: Track new exchange in Mixpanel
};

module.exports = (exchange) => {
  newExchangeNotification(exchange);
  trackNewExchange(exchange);
};
