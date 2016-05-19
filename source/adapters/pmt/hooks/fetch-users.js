import pmtClient from 'adapters/pmt/client';

export default baseUrl => {
  return pmtClient(`${baseUrl}/users`)
    .then(res => res.json())
    .then(json => json.data)
    .catch(err => console.log(err));
};
