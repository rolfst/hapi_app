import { map, filter } from 'lodash';
import * as Logger from '../services/logger';
import client from '../../adapters/pmt/client';
import createError from '../utils/create-error';
import clientSerializer from '../../adapters/pmt/serializers/chain';
import storesSerializer from '../../adapters/pmt/serializers/stores';
import userSerializer from '../../adapters/pmt/serializers/user';

const logger = Logger.createLogger('SHARED/utils/integrationsAdapter');

export const clients = async (message) => {
  try {
    const endpoint = 'https://partner2.testpmt.nl/rest.php/chains';
    const result = await client.get(endpoint, message);

    return map(result.payload.chains, clientSerializer);
  } catch (err) {
    logger.warn('Error retrieving clients', { err, message });

    throw createError('500', 'Cannot retrieve integration partner clients.');
  }
};

export const pristineNetworks = async (url, message) => {
  try {
    const endpoint = `${url}/stores`;
    const result = await client.get(endpoint, message);

    return map(result.payload.stores, storesSerializer);
  } catch (err) {
    logger.warn('Error retrieving networks', { err, message });

    throw createError('404', `Cannot retrieve pristine networks for client with url ${url}.`);
  }
};

export const usersFromPristineNetwork = async (url, message) => {
  try {
    const endpoint = `${url}/users`;
    const result = await client.get(endpoint, message);

    return map(result.payload.data, userSerializer);
  } catch (err) {
    logger.warn('Error retrieving users of pristine networks', { err, message });

    throw createError('404', `Cannot retrieve admins for pristine network ${url}.`);
  }
};

export const adminsFromPristineNetworks = async (url, message) => {
  try {
    const data = await usersFromPristineNetwork(url, message);

    return filter(data, 'isAdmin');
  } catch (err) {
    logger.warn('Error retrieving users for admin selection of pristine networks',
      { err, message }
    );

    throw createError('404', `Cannot retrieve admins for pristine network ${url}.`);
  }
};

