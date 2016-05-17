import pmtClient from 'adapters/pmt/client';
import moment from 'moment';

export default baseUrl => {
  const date = moment().format('DD-MM-YYYY');
  const endpoint = `${baseUrl}/me/shifts/${date}`;

  return pmtClient(endpoint)
    .then(data => data.shifts)
    .catch(err => console.log(err));
};
