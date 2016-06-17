import createAdapterHook from 'common/utils/create-adapter-hook';
import client from 'adapters/pmt/client';

const hook = token => (baseStoreUrl, userId, input) => {
  const endpoint = `${baseStoreUrl}/me`;
  const data = { email: input.email };

  return client.post(token, endpoint, data)
    .then(res => res);
};

export default createAdapterHook(hook);
