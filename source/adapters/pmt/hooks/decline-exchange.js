import pmtClient from 'adapters/pmt/client';

export default (baseUrl, shiftId) => {
  const endpoint = `${baseUrl}/shift/${shiftId}/notInterestedInShift`;

  return pmtClient(endpoint)
    .then(res => res.json())
    .then(data => data.successful)
    .catch(err => console.log(err));
};
