import { flatten, chain, pipe, pick, propEq, cond, reject, isNil } from 'ramda';
import * as Logger from '../../../../shared/services/logger';
import * as flexchangeService from '../../../flexchange/services/flexchange';
import * as objectService from '../object';
import * as impl from './implementation';

/**
 * @module modules/feed/services/object
 */

const logger = Logger.getLogger('FEED/service/feed');

/**
 * Making a feed for a parent
 * @param {object} payload - Object containing payload data
 * @param {string} payload.parentType - The type of parent to get objects for
 * @param {string} payload.parentId - The id of the parent
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method make
 * @return {external:Promise.<Mixed[]>}
 */
export const make = async (payload, message) => {
  logger.info(`Making feed for ${payload.parentType}`, { payload, message });

  const relatedObjects = await objectService.list(
    pick(['parentType', 'parentId'], payload), message);

  const typeEq = propEq('type');
  const resourcePromises = pipe(
    impl.flattenObjectTypeValues,
    chain(cond([
      [typeEq('message'), (obj) =>
        Promise.resolve([{ id: '1', foo: 'bar' }])],
      [typeEq('exchange'), (obj) =>
        flexchangeService.list({ exchangeIds: obj.values }, message)],
    ])),
    reject(isNil)
  )(relatedObjects);

  // TODO add messages to feed

  console.log(flatten(await Promise.all(resourcePromises)));
};
