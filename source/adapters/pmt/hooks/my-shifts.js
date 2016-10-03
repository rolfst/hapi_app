import moment from 'moment';
import client from 'adapters/pmt/client';
import shiftSerializer from 'adapters/pmt/serializers/shift';

export default (baseStoreUrl, token) => async () => {
  const date = moment().format('DD-MM-YYYY');
  const endpoint = `${baseStoreUrl}/me/shifts/${date}`;
  const result = await client.get(endpoint, token);

  return result.payload.shifts.map(shiftSerializer);
};
