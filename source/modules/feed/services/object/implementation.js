import R from 'ramda';
import * as flexchangeService from '../../../flexchange/services/flexchange';
import * as privateMessageService from '../../../chat/v2/services/private-message';
import * as feedMessageService from '../message';

/**
 * Find the sources for the object by type.
 * @param {object} message {@link module:shared~Message message} - Object containing meta data
 * @param {string[]} values - An array of ids that belong to a object type
 * @param {string} type - The object type
 * @method findSourcesForType
 * @return {Promise}
 */
export const findSourcesForType = R.curry((message, values, type) => R.cond([
  [R.equals('private_message'), () => privateMessageService.list({ messageIds: values }, message)],
  [R.equals('feed_message'), () => feedMessageService.list({ messageIds: values }, message)],
  [R.equals('exchange'), () => flexchangeService.list({ exchangeIds: values }, message)],
])(type, values));
