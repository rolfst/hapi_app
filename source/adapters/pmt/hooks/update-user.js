import pmtClient from 'adapters/pmt/client';

export default (baseStoreUrl, userId, input) => {
  const endpoint = `${baseStoreUrl}/me`;

  const data = {
    username: input.email,
  };

  console.log(data);

  return pmtClient('5ddf461ecf593acb207d0f6df36d0f36', endpoint, 'POST', data)
    .then(res => res);
};
