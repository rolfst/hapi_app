import client from 'adapters/pmt/client';

export default (baseStoreUrl, shiftId) => {
  const endpoint = `${baseStoreUrl}/shift/${shiftId}/available`;

  return client.get(endpoint)
    .then(res => res.users)
    .catch(err => console.log(err));
};
