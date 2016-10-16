import { map, filter } from 'lodash';
import client from '../../adapters/pmt/client';
import createError from '../utils/create-error';
import clientSerializer from '../../adapters/pmt/serializers/chain';
import storesSerializer from '../../adapters/pmt/serializers/stores';
import userSerializer from '../../adapters/pmt/serializers/user';

export const clients = async () => {
  try {
    const endpoint = 'https://partner2.testpmt.nl/rest.php/chains';
    const result = await client.get(endpoint);

    return map(result.payload.chains, clientSerializer);
  } catch (err) {
    console.log('Error retrieving clients', err);

    throw createError('500', 'Cannot retrieve integration partner clients.');
  }
};

export const pristineNetworks = async (url) => {
  try {
    const endpoint = `${url}/stores`;
    const result = await client.get(endpoint);

    return map(result.payload.stores, storesSerializer);
  } catch (err) {
    console.log('Error retrieving networks', err);

    throw createError('404', `Cannot retrieve pristine networks for client with url ${url}.`);
  }
};

export const usersFromPristineNetwork = async (url) => {
  try {
    const endpoint = `${url}/users`;
    const result = await client.get(endpoint);

    return map(result.payload.data, userSerializer);
  } catch (err) {
    console.log('Error retrieving users of pristine networks', err);

    throw createError('404', `Cannot retrieve admins for pristine network ${url}.`);
  }
};

export const adminsFromPristineNetworks = async (url) => {
  try {
    const data = await usersFromPristineNetwork(url);

    return filter(data, 'isAdmin');
  } catch (err) {
    console.log('Error retrieving users for admin selection of pristine networks', err);

    throw createError('404', `Cannot retrieve admins for pristine network ${url}.`);
  }
};

