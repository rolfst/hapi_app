/**
 * Creates an EventQuery script for mixpanel
 * @param  {object} payload - the container for the query properties
 * @param  {string} payload.event - the metric that is queried
 * @param  {string} payload.networkId - the network identifier to search within
 * @param  {string} payload.idType - the field for which the metric is grouped by
 * @param  {string} payload.type - the type for which the query is build .eg user, team
 * @param {date} payload.startDate - begining of query
 * @param {date} payload.endDate - end of query
 * @return string - the query to be used
 */
function createEventQueryString(payload) {
  const startDate = payload.startDate.toISOString().substr(0, 10);
  const endDate = payload.endDate.toISOString().substr(0, 10);

  return `
    function main() {
      const createdEventDate = (tuple) => tuple.event.properties['Created At'].toISOString().substr(0, 10);

      return join(
        Events({
          from_date: '${startDate}',
          to_date:   '${endDate}',
          event_selectors: [{ event: 'Created Message', selector: 'properties["Network Id"] == "${payload.networkId}"' }]
        }),
        People(),
        {type: 'left'}
      )
      .filter((tuple) => tuple.event.properties['Created At'] && tuple.event.${payload.idType})
      .groupBy(['event.${payload.idTypeCode}', createdEventDate], mixpanel.reducer.count())
      .reduce((acc, items) => {
        return items.reduce((acc, item) => {
          const id = item.key[0];
          const eventDate = item.key[1];

          if (!acc[id]) acc[id] = { type: '${payload.type}', id, values: {} };
          acc[id].values[eventDate] = item.value;

          return acc;
        }, {});
      })
      .map((item) => {
        return Object.keys(item).map((key) => item[key]);
      })
  } `;
}

module.exports = createEventQueryString;
