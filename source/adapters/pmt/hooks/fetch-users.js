import client from 'adapters/pmt/client';

export default (baseStoreUrl) => {
  return client.get(`${baseStoreUrl}/users`)
    .then(res => res.data)
    .catch(err => console.log(err));
};
