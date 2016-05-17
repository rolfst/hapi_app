import pmtClient from 'adapters/pmt/client';

export default (baseUrl, shiftId) => {
  const endpoint = `${baseUrl}/shift/${shiftId}/available`;

  return pmtClient(endpoint)
    .then(data => data.users)
    .catch(err => console.log(err));
};
