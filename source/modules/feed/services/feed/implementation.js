import R from 'ramda';
import Promise from 'bluebird';
import * as objectRepository from '../../../core/repositories/object';
import * as objectService from '../../../core/services/object';
import * as messageService from '../message';

const typeEq = R.propEq('objectType');
const pluckId = R.pluck('id');
const messageIdEq = R.propEq('messageId');
const findIncludes = (object, includes) => (typeEq('feed_message')) ?
  R.defaultTo(null, R.filter(messageIdEq(object.sourceId), includes)) : null;
const anyWithType = (type, objects) => R.any(typeEq(type), objects);
const getSourceIdsForType = (type, objects) => R.pipe(
  R.filter(typeEq(type)), R.pluck('sourceId'))(objects);

/**
 * Get resources that belong to object as child.
 * @param {function} hasInclude - Function to determine the includes passed from request
 * @param {Object[]} objects {@link module:modules/feed~Object object}
 * @method getIncludes
 * @return {external:Promise}
 */
export const getIncludes = async (hasInclude, objects) => {
  const hasType = (type) => anyWithType(type, objects);
  const includes = { comments: [], likes: [] };

  if (hasType('feed_message')) {
    const messageIds = getSourceIdsForType('feed_message', objects);

    if (hasInclude('comments')) {
      includes.comments = messageService.getComments({ messageIds });
    }

    if (hasInclude('likes')) {
      includes.likes = messageService.listLikes({ messageIds });
    }
  }

  return Promise.props(includes);
};

export const makeFeed = async (payload, options, message, extraWhereConstraint = {}) => {
  const whereConstraint = {
    $or: [...extraWhereConstraint, {
      parentType: payload.parentType,
      parentId: payload.parentId,
    }],
  };

  const relatedObjects = await objectRepository.findBy(whereConstraint, {
    limit: options.limit,
    offset: options.offset,
    order: [['created_at', 'DESC']],
  });

  const hasInclude = R.contains(R.__, options.include || []);
  const [includes, objectsWithSources] = await Promise.all([
    getIncludes(hasInclude, relatedObjects),
    objectService.listWithSourceAndChildren({ objectIds: pluckId(relatedObjects) }, message),
  ]);

  const addComments = (object) =>
    R.assoc('comments', findIncludes(object, includes.comments), object);
  const addLikes = (object) =>
    R.assoc('likes', findIncludes(object, includes.likes), object);

  const createObjectWithIncludes = R.cond([
    [() => R.and(hasInclude('comments'), hasInclude('likes')), R.pipe(addComments, addLikes)],
    [() => hasInclude('comments'), addComments],
    [() => hasInclude('likes'), addLikes],
    [R.T, R.identity],
  ]);

  return R.map(createObjectWithIncludes, objectsWithSources);
};
