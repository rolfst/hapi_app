import client from 'adapters/pmt/client';

export default (baseStoreUrl, shiftId) => {
  const endpoint = `${baseStoreUrl}/shift/${shiftId}/notInterestedInShift`;

  return client.post(endpoint)
    .then(res => res.successful)
    .catch(err => console.log(err));
};
