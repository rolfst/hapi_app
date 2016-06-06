import pmtClient from 'adapters/pmt/client';

export default baseUrl => {
  const endpoint = `${baseUrl}/me`;

  return pmtClient(endpoint)
    .then(data => data.shifts)
    .catch(err => console.log(err));
};
