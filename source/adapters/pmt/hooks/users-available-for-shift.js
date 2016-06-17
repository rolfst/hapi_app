import createAdapterHook from 'common/utils/create-adapter-hook';
import client from 'adapters/pmt/client';

const hook = token => (baseStoreUrl, shiftId) => {
  const endpoint = `${baseStoreUrl}/shift/${shiftId}/available`;

  return client.get(endpoint, token)
    .then(res => res.users)
    .catch(err => console.log(err));
};

export default createAdapterHook(hook);
