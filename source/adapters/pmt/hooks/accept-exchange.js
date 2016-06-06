import client from 'adapters/pmt/client';

export default (baseStoreUrl, shiftId) => {
  const endpoint = `${baseStoreUrl}/shift/${shiftId}/interestedInShift`;

  return client.get(endpoint)
    .then(res => res.successful)
    .catch(err => console.log(err));
};
