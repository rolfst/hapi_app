/**
 * Dispatch an event
 *
 * Example: dispatch(exchangeWasCreated(exchange))
 *
 * @param {object} event - The event to trigger
   * @param {array} listeners - The listeners that have to be triggered
   * @param {array} arguments - The event arguments to pass to the listeners
 * @return {void}
 */
export default (event) => {
  return event.listeners.map(listener => listener(...event.arguments));
}
