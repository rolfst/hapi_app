import moment from 'moment';
import client from 'adapters/pmt/client';
import shiftSerializer from 'adapters/pmt/serializers/shift';

export default (token) => async (baseStoreUrl) => {
  try {
    const date = moment().format('DD-MM-YYYY');
    const endpoint = `${baseStoreUrl}/me/shifts/${date}`;
    const result = await client.get(endpoint, token);

    return result.shifts.map(shiftSerializer);
  } catch (err) {
    console.log('Error retrieving shifts from PMT:', err);

    throw err;
  }
};
