import createAdapterHook from 'common/utils/create-adapter-hook';
import client from 'adapters/pmt/client';

const hook = token => (baseStoreUrl, shiftId) => {
  const endpoint = `${baseStoreUrl}/shift/${shiftId}/interestedInShift`;

  return client.get(token, endpoint)
    .then(res => res.successful)
    .catch(err => console.log(err));
};

export default createAdapterHook(hook);
