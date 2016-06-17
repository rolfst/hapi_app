import moment from 'moment';
import createAdapterHook from 'common/utils/create-adapter-hook';
import client from 'adapters/pmt/client';
import shiftSerializer from 'adapters/pmt/serializers/shift';

const hook = token => baseStoreUrl => {
  const date = moment().format('DD-MM-YYYY');
  const endpoint = `${baseStoreUrl}/me/shifts/${date}`;

  return client.get(endpoint, token)
    .then(res => res.shifts.map(s => shiftSerializer(s)))
    .catch(err => console.log('error', err));
};

export default createAdapterHook(hook);
