import pmtClient from 'integrations/pmt/client';

export default (baseUrl, shiftId) => {
  const endpoint = `${baseUrl}/shift/${shiftId}/available`;

  return pmtClient(endpoint)
    .then(res => res.json())
    .then(data => data.users)
    .catch(err => console.log(err));
};
