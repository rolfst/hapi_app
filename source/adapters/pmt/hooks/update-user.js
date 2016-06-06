import client from 'adapters/pmt/client';

export default (baseStoreUrl, userId, input) => {
  const endpoint = `${baseStoreUrl}/me`;

  const data = {
    username: input.email,
  };

  return client.post(endpoint, data)
    .then(res => res);
};
