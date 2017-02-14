import R from 'ramda';
import * as flexchangeService from '../../../flexchange/services/flexchange';
import * as pollService from '../../../poll/services/poll';
import * as attachmentService from '../../../attachment/services/attachment';
import * as privateMessageService from '../../../chat/v2/services/private-message';
import * as objectRepository from '../../repositories/object';
import * as feedMessageService from '../message';

const whereTypeAndId = (type, id) => R.both(R.propEq('type', type), R.propEq('id', id));
const findSource = (type, id, sources) => R.find(whereTypeAndId(type, id), sources) || null;
const compareObject = R.curry((object1, object2) => R.and(
  R.equals(object1.parentType, object2.objectType),
  R.equals(object1.parentId, object2.sourceId)));

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
  [R.equals('poll'), () => pollService.list({ pollIds: values }, message)],
  [R.equals('attachment'), () => attachmentService.list({ attachmentIds: values }, message)],
])(type, values));

export const findChildrenForType = R.curry((values, type) => R.cond([
  [R.equals('feed_message'), () => objectRepository.findBy({
    parentType: 'feed_message', parentId: { $in: values } })],
])(type, values));

export const addSourceToObject = R.curry((sources, object) =>
  R.merge(object, { source: findSource(object.objectType, object.sourceId, sources) }));

export const findChildren = (objectsWithSource, object) =>
  R.filter(compareObject(R.__, object), objectsWithSource);
