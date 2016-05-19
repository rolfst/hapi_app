export default (exchange) => {
  newExchangeNotification(exchange);
  trackNewExchange(exchange);
}

const newExchangeNotification = exchange => {
  // Fire notification
  console.log('notification push');
}

const trackNewExchange = exchange => {
  // Track new exchange in Mixpanel
  console.log('track mixpanel event');
}
