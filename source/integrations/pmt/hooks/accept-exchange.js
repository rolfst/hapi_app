import pmtClient from 'integrations/pmt/client';

export default (baseUrl, shiftId) => {
  const endpoint = `${baseUrl}/shift/${shiftId}/interestedInShift`;

  return pmtClient(endpoint)
    .then(res => res.json())
    .then(data => data.successful)
    .catch(err => console.log(err));
};
