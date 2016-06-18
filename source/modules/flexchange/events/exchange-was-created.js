const newExchangeNotification = exchange => {
  // Fire notification
  console.log('notification push for: ', exchange.title);
};

const trackNewExchange = exchange => {
  // Track new exchange in Mixpanel
  console.log('track mixpanel event for: ', exchange.title);
};

export default (exchange) => {
  newExchangeNotification(exchange);
  trackNewExchange(exchange);
};
