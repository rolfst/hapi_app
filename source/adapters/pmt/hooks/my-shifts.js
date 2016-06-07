import client from 'adapters/pmt/client';
import moment from 'moment';

export default (baseStoreUrl) => {
  const date = moment().format('DD-MM-YYYY');
  const endpoint = `${baseStoreUrl}/me/shifts/${date}`;

  return client.get(endpoint)
    .then(res => res.shifts)
    .catch(err => console.log(err));
};
