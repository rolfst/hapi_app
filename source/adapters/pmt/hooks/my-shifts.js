import moment from 'moment';
import client from '../client';
import shiftSerializer from '../serializers/shift';

export default (baseStoreUrl, token) => async () => {
  const date = moment().format('DD-MM-YYYY');
  const endpoint = `${baseStoreUrl}/me/shifts/${date}`;
  const result = await client.get(endpoint, token);

  return result.payload.shifts.map(shiftSerializer);
};
